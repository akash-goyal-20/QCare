const pool = require('../config/db');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: verify admin owns the hospital
// ─────────────────────────────────────────────────────────────────────────────
const assertOwnership = (req, hospitalId) => {
  if (req.user.hospitalId !== parseInt(hospitalId)) {
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/:id/doctors
// Returns all doctors for a hospital with booking + slot counts
// ─────────────────────────────────────────────────────────────────────────────
const getDoctors = async (req, res) => {
  const { id } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  try {
    const result = await pool.query(
      `SELECT
         d.*,
         COUNT(DISTINCT s.id)                                      AS total_slots,
         COUNT(DISTINCT s.id) FILTER (WHERE s.is_booked = FALSE)  AS available_slots
       FROM doctors d
       LEFT JOIN slots s ON s.doctor_id = d.id AND s.slot_date >= CURRENT_DATE
       WHERE d.hospital_id = $1
       GROUP BY d.id
       ORDER BY d.specialty, d.name`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getDoctors error:', err);
    res.status(500).json({ error: 'Failed to fetch doctors.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hospitals/:id/doctors
// Add a new doctor to the admin's hospital
// ─────────────────────────────────────────────────────────────────────────────
const addDoctor = async (req, res) => {
  const { id } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  const {
    name,
    specialty,
    qualification = '',
    experience = 0,
    consultation_fee = 0,
    working_hours = '09:00-17:00',
    available = true,
  } = req.body;

  if (!name || !specialty)
    return res.status(400).json({ error: 'name and specialty are required.' });

  const expInt = isNaN(parseInt(experience)) ? 0 : parseInt(experience);
  const feeInt = isNaN(parseInt(consultation_fee)) ? 0 : parseInt(consultation_fee);

  try {
    const result = await pool.query(
      `INSERT INTO doctors
         (hospital_id, name, specialty, qualification, experience, consultation_fee, working_hours, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, name, specialty, qualification, expInt, feeInt, working_hours, available]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addDoctor error:', err);
    res.status(500).json({ error: 'Failed to add doctor.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/hospitals/:id/doctors/:docId
// Update a doctor's details
// ─────────────────────────────────────────────────────────────────────────────
const updateDoctor = async (req, res) => {
  const { id, docId } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  const {
    name,
    specialty,
    qualification,
    experience,
    consultation_fee,
    working_hours,
    available,
  } = req.body;

  try {
    // Confirm doctor belongs to this hospital
    const check = await pool.query(
      'SELECT id FROM doctors WHERE id = $1 AND hospital_id = $2',
      [docId, id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ error: 'Doctor not found in your hospital.' });

    const result = await pool.query(
      `UPDATE doctors SET
         name            = COALESCE($1, name),
         specialty       = COALESCE($2, specialty),
         qualification   = COALESCE($3, qualification),
         experience      = COALESCE($4, experience),
         consultation_fee = COALESCE($5, consultation_fee),
         working_hours   = COALESCE($6, working_hours),
         available       = COALESCE($7, available)
       WHERE id = $8 AND hospital_id = $9
       RETURNING *`,
      [
        name,
        specialty,
        qualification,
        experience !== undefined ? (isNaN(parseInt(experience)) ? 0 : parseInt(experience)) : undefined,
        consultation_fee !== undefined ? (isNaN(parseInt(consultation_fee)) ? 0 : parseInt(consultation_fee)) : undefined,
        working_hours,
        available,
        docId,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateDoctor error:', err);
    res.status(500).json({ error: 'Failed to update doctor.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/hospitals/:id/doctors/:docId
// Delete a doctor (cascades to slots via ON DELETE CASCADE)
// ─────────────────────────────────────────────────────────────────────────────
const deleteDoctor = async (req, res) => {
  const { id, docId } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  try {
    const result = await pool.query(
      'DELETE FROM doctors WHERE id = $1 AND hospital_id = $2 RETURNING id',
      [docId, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Doctor not found in your hospital.' });

    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    console.error('deleteDoctor error:', err);
    res.status(500).json({ error: 'Failed to delete doctor.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/:id/doctors/:docId/slots
// Get all future slots for a specific doctor (admin view)
// ─────────────────────────────────────────────────────────────────────────────
const getDoctorSlots = async (req, res) => {
  const { id, docId } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  try {
    const result = await pool.query(
      `SELECT s.*, u.name AS patient_name
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = 'confirmed'
       LEFT JOIN users u ON b.patient_id = u.id
       WHERE s.doctor_id = $1 AND s.hospital_id = $2 AND s.slot_date >= CURRENT_DATE
       ORDER BY s.slot_date, s.slot_time`,
      [docId, id]
    );

    const now = new Date();
    const filteredSlots = result.rows.filter((row) => {
      if (!row.slot_date || !row.slot_time) return false;
      const [year, month, day] = row.slot_date.split('-').map(Number);
      const [hour, minute] = row.slot_time.split(':').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hour, minute, 0);
      return slotDateTime >= now;
    });

    res.json(filteredSlots);
  } catch (err) {
    console.error('getDoctorSlots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hospitals/:id/slots
// Bulk-create slots for a doctor across a date + time range
// Body: { doctorId, date, startTime, endTime, intervalMinutes }
// ─────────────────────────────────────────────────────────────────────────────
const createSlots = async (req, res) => {
  const { id } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  const { doctorId, date, startTime, endTime, intervalMinutes = 30 } = req.body;

  if (!doctorId || !date || !startTime || !endTime)
    return res.status(400).json({ error: 'doctorId, date, startTime, endTime are required.' });

  // Confirm doctor belongs to this hospital
  try {
    const check = await pool.query(
      'SELECT id FROM doctors WHERE id = $1 AND hospital_id = $2',
      [doctorId, id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ error: 'Doctor not found in your hospital.' });

    // Generate time slots
    const slots = [];
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let currentMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const interval = parseInt(intervalMinutes);

    while (currentMins < endMins) {
      const h = String(Math.floor(currentMins / 60)).padStart(2, '0');
      const m = String(currentMins % 60).padStart(2, '0');
      slots.push(`${h}:${m}`);
      currentMins += interval;
    }

    const uniqueSlots = Array.from(new Set(slots));

    if (uniqueSlots.length === 0)
      return res.status(400).json({ error: 'No slots generated. Check time range.' });

    // Fetch existing slots to filter out duplicates
    const existingResult = await pool.query(
      `SELECT slot_time FROM slots
       WHERE doctor_id = $1 AND hospital_id = $2 AND slot_date = $3`,
      [doctorId, id, date]
    );

    const existingTimes = new Set(
      existingResult.rows.map((row) => {
        // row.slot_time is a string, format it to 'HH:MM'
        return row.slot_time.split(':').slice(0, 2).join(':');
      })
    );

    const slotsToCreate = uniqueSlots.filter((t) => !existingTimes.has(t));

    let createdSlots = [];
    if (slotsToCreate.length > 0) {
      // Bulk insert with ON CONFLICT DO NOTHING (idempotent safety net)
      const values = slotsToCreate.map((t, i) => `($1, $2, $3, $${i + 4})`).join(', ');
      const params = [doctorId, id, date, ...slotsToCreate];
      const query = `
        INSERT INTO slots (doctor_id, hospital_id, slot_date, slot_time)
        VALUES ${values}
        ON CONFLICT (doctor_id, slot_date, slot_time) DO NOTHING
        RETURNING *
      `;
      const result = await pool.query(query, params);
      createdSlots = result.rows;
    }

    res.status(201).json({
      created: createdSlots.length,
      slots: createdSlots,
    });
  } catch (err) {
    console.error('createSlots error:', err);
    res.status(500).json({ error: 'Failed to create slots.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/hospitals/:id/slots/:slotId
// Delete an unbooked slot
// ─────────────────────────────────────────────────────────────────────────────
const deleteSlot = async (req, res) => {
  const { id, slotId } = req.params;
  if (!assertOwnership(req, id))
    return res.status(403).json({ error: 'You can only manage your own hospital.' });

  try {
    // Check slot exists, belongs to hospital, and is not booked
    const check = await pool.query(
      'SELECT id, is_booked FROM slots WHERE id = $1 AND hospital_id = $2',
      [slotId, id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ error: 'Slot not found in your hospital.' });
    if (check.rows[0].is_booked)
      return res.status(409).json({ error: 'Cannot delete a booked slot. Cancel the booking first.' });

    await pool.query('DELETE FROM slots WHERE id = $1', [slotId]);
    res.json({ message: 'Slot deleted successfully.' });
  } catch (err) {
    console.error('deleteSlot error:', err);
    res.status(500).json({ error: 'Failed to delete slot.' });
  }
};

module.exports = {
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
  createSlots,
  deleteSlot,
};
