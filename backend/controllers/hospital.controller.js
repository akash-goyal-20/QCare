const pool = require('../config/db');
const { broadcastWaitTime } = require('../websocket/wsServer');

// GET /api/hospitals
// Query params: lat, lng, radius (km), specialty
const searchHospitals = async (req, res) => {
  const {
    lat,
    lng,
    radius = 10,       // default 10km
    specialty = 'All',
  } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required.' });
  }

  const radiusMeters = parseFloat(radius) * 1000;

  try {
    const query = `
      SELECT
        h.id,
        h.name,
        h.address,
        h.phone,
        h.image_url,
        h.specialties,
        h.wait_time_minutes,
        h.available_beds,
        h.total_beds,
        h.is_accepting,
        h.rating,
        h.last_updated,
        ST_X(h.location::geometry) AS lng,
        ST_Y(h.location::geometry) AS lat,
        ROUND(
          (ST_Distance(
            h.location,
            ST_MakePoint($2, $1)::geography
          ) / 1000)::numeric,
          2
        ) AS distance_km
      FROM hospitals h
      WHERE
        ST_DWithin(
          h.location,
          ST_MakePoint($2, $1)::geography,
          $3
        )
        AND ($4 = 'All' OR $4 = ANY(h.specialties))
      ORDER BY distance_km ASC
    `;

    const result = await pool.query(query, [
      parseFloat(lat),
      parseFloat(lng),
      radiusMeters,
      specialty,
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error('Hospital search error:', err.message, err.stack);
    res.status(500).json({ error: 'Hospital search failed.', detail: err.message });
  }
};

// GET /api/hospitals/:id
const getHospitalById = async (req, res) => {
  const { id } = req.params;

  try {
    const hospitalResult = await pool.query(
      `SELECT
        h.*,
        ST_X(h.location::geometry) AS lng,
        ST_Y(h.location::geometry) AS lat
       FROM hospitals h
       WHERE h.id = $1`,
      [id]
    );

    if (hospitalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const hospital = hospitalResult.rows[0];

    // Fetch doctors for this hospital
    const doctorsResult = await pool.query(
      `SELECT id, name, specialty, available, qualification, experience, consultation_fee, working_hours
       FROM doctors
       WHERE hospital_id = $1
       ORDER BY specialty`,
      [id]
    );

    res.json({
      ...hospital,
      doctors: doctorsResult.rows,
    });
  } catch (err) {
    console.error('Get hospital error:', err);
    res.status(500).json({ error: 'Failed to fetch hospital.' });
  }
};

// PATCH /api/hospitals/:id/status  (admin only)
// Triggered by hospital admin — updates wait time + beds
// This also publishes to Redis Pub/Sub (wired in Task 05)
const updateHospitalStatus = async (req, res) => {
  const { id } = req.params;
  const { wait_time_minutes, available_beds, is_accepting, specialties } = req.body;

  // Ensure admin can only update their own hospital
  if (req.user.hospitalId !== parseInt(id)) {
    return res.status(403).json({ error: 'You can only update your own hospital.' });
  }

  try {
    const result = await pool.query(
      `UPDATE hospitals
       SET
         wait_time_minutes = COALESCE($1, wait_time_minutes),
         available_beds = COALESCE($2, available_beds),
         is_accepting = COALESCE($3, is_accepting),
         specialties = COALESCE($4, specialties),
         last_updated = NOW()
       WHERE id = $5
       RETURNING *`,
      [wait_time_minutes, available_beds, is_accepting, specialties, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const updatedHospital = result.rows[0];

    // Broadcast directly to subscribed WebSocket clients (single-instance, no Pub/Sub needed)
    broadcastWaitTime(parseInt(id), {
      hospitalId: parseInt(id),
      waitTimeMinutes: updatedHospital.wait_time_minutes,
      availableBeds: updatedHospital.available_beds,
      isAccepting: updatedHospital.is_accepting,
      lastUpdated: updatedHospital.last_updated,
    });

    res.json(updatedHospital);
  } catch (err) {
    console.error('Update hospital status error:', err);
    res.status(500).json({ error: 'Failed to update hospital status.' });
  }
};

// GET /api/slots?doctorId=&date=
const getSlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ error: 'doctorId and date are required.' });
  }

  try {
    const result = await pool.query(
      `SELECT s.id, s.slot_time, s.is_booked, d.name AS doctor_name, d.specialty
       FROM slots s
       JOIN doctors d ON s.doctor_id = d.id
       WHERE s.doctor_id = $1
         AND s.slot_date = $2
       ORDER BY s.slot_time`,
      [doctorId, date]
    );

    const now = new Date();
    const filteredSlots = result.rows.filter((row) => {
      if (!row.slot_time) return false;
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = row.slot_time.split(':').map(Number);
      const slotDateTime = new Date(year, month - 1, day, hour, minute, 0);
      return slotDateTime >= now;
    });

    res.json(filteredSlots);
  } catch (err) {
    console.error('Get slots error:', err);
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
};

// PATCH /api/hospitals/:id/info (admin only)
const updateHospitalInfo = async (req, res) => {
  const { id } = req.params;
  const { about, image_url, contact_email, phone, gallery_image_1, gallery_image_2 } = req.body;

  if (req.user.hospitalId !== parseInt(id)) {
    return res.status(403).json({ error: 'You can only update your own hospital.' });
  }

  try {
    const result = await pool.query(
      `UPDATE hospitals
       SET
         about = COALESCE($1, about),
         image_url = COALESCE($2, image_url),
         contact_email = COALESCE($3, contact_email),
         phone = COALESCE($4, phone),
         gallery_image_1 = COALESCE($5, gallery_image_1),
         gallery_image_2 = COALESCE($6, gallery_image_2),
         last_updated = NOW()
       WHERE id = $7
       RETURNING *`,
      [about, image_url, contact_email, phone, gallery_image_1, gallery_image_2, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update hospital info error:', err);
    res.status(500).json({ error: 'Failed to update hospital info.' });
  }
};

module.exports = {
  searchHospitals,
  getHospitalById,
  updateHospitalStatus,
  getSlots,
  updateHospitalInfo,
};
