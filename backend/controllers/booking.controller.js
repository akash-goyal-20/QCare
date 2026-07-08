const pool = require('../config/db');
const { redis } = require('../config/redis');

// POST /api/bookings
const createBooking = async (req, res) => {
  const { slotId, doctorId, hospitalId } = req.body;
  const patientId = req.user.id;
  const idempotencyKey = req.idempotencyKey;
  const idempotencyRedisKey = req.idempotencyRedisKey;

  if (!slotId || !doctorId || !hospitalId) {
    return res.status(400).json({ error: 'slotId, doctorId, hospitalId are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check slot is still available
    const slotCheck = await client.query(
      'SELECT id, is_booked FROM slots WHERE id = $1 FOR UPDATE',
      [slotId]
    );

    if (slotCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found.' });
    }

    if (slotCheck.rows[0].is_booked) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot already booked.' });
    }

    // Mark slot as booked
    await client.query(
      'UPDATE slots SET is_booked = TRUE WHERE id = $1',
      [slotId]
    );

    // Create booking
    // ON CONFLICT on idempotency_key = DB-level safety net
    const bookingResult = await client.query(
      `INSERT INTO bookings
         (patient_id, doctor_id, slot_id, hospital_id, idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [patientId, doctorId, slotId, hospitalId, idempotencyKey]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];

    // Cache full response in Redis for 24 hours
    if (idempotencyRedisKey) {
      await redis.set(
        idempotencyRedisKey,
        JSON.stringify(booking),
        'EX',
        86400
      );
    }

    res.status(201).json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Booking failed.' });
  } finally {
    client.release();
  }
};

// GET /api/bookings/my
const getMyBookings = async (req, res) => {
  const patientId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.status,
         b.created_at,
         d.name AS doctor_name,
         d.specialty,
         h.name AS hospital_name,
         h.address AS hospital_address,
         s.slot_date,
         s.slot_time
       FROM bookings b
       JOIN doctors d ON b.doctor_id = d.id
       JOIN hospitals h ON b.hospital_id = h.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.patient_id = $1
         AND b.status != 'cancelled'
       ORDER BY s.slot_date ASC, s.slot_time ASC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// DELETE /api/bookings/:id  (cancel)
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify booking belongs to this patient
    const bookingResult = await client.query(
      'SELECT id, slot_id, status FROM bookings WHERE id = $1 AND patient_id = $2',
      [id, patientId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingResult.rows[0];

    if (booking.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Booking already cancelled.' });
    }

    // Cancel booking
    await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    // Free up the slot
    await client.query(
      'UPDATE slots SET is_booked = FALSE WHERE id = $1',
      [booking.slot_id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  } finally {
    client.release();
  }
};

// GET /api/bookings/admin (hospital admin sees their hospital's bookings)
const getHospitalBookings = async (req, res) => {
  const hospitalId = req.user.hospitalId;

  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.status,
         b.created_at,
         u.name AS patient_name,
         d.name AS doctor_name,
         d.specialty,
         s.slot_date,
         s.slot_time
       FROM bookings b
       JOIN users u ON b.patient_id = u.id
       JOIN doctors d ON b.doctor_id = d.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.hospital_id = $1
       ORDER BY s.slot_date ASC, s.slot_time ASC`,
      [hospitalId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get hospital bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

// PATCH /api/bookings/:id/status (admin only)
const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const hospitalId = req.user.hospitalId;

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT id, slot_id, status, hospital_id FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingResult.rows[0];

    if (booking.hospital_id !== hospitalId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You can only manage bookings for your own hospital.' });
    }

    const updateResult = await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (status === 'cancelled' && booking.status !== 'cancelled') {
      await client.query(
        'UPDATE slots SET is_booked = FALSE WHERE id = $1',
        [booking.slot_id]
      );
    } else if (status !== 'cancelled' && booking.status === 'cancelled') {
      const slotCheck = await client.query(
        'SELECT is_booked FROM slots WHERE id = $1 FOR UPDATE',
        [booking.slot_id]
      );
      if (slotCheck.rows.length > 0 && slotCheck.rows[0].is_booked) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Cannot confirm booking. The associated slot is already booked.' });
      }
      await client.query(
        'UPDATE slots SET is_booked = TRUE WHERE id = $1',
        [booking.slot_id]
      );
    }

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking status.' });
  } finally {
    client.release();
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getHospitalBookings, updateBookingStatus };
