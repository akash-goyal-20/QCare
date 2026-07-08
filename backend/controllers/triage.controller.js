const pool = require('../config/db');

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// POST /api/triage
const analyze = async (req, res) => {
  const { symptoms } = req.body;
  const patientId = req.user?.id || null;

  if (!symptoms || symptoms.trim().length < 10) {
    return res.status(400).json({
      error: 'Please describe your symptoms in more detail (at least 10 characters).',
    });
  }

  if (symptoms.length > 1000) {
    return res.status(400).json({ error: 'Symptom description too long (max 1000 characters).' });
  }

  try {
    const prompt = `
You are a medical triage assistant for an Indian hospital platform.
Analyze the patient's symptoms and return ONLY a valid JSON object.
Do not include any explanation, markdown, or text outside the JSON.

Patient symptoms: "${symptoms}"

Return exactly this JSON structure:
{
  "urgency": "low" | "moderate" | "urgent" | "critical",
  "emergency": true | false,
  "recommended_specialty": "one of: General Practice, Cardiology, Orthopedics, Pediatrics, Gynecology, Neurology, Diagnostics, Emergency",
  "suggested_action": "a brief action recommendation for the patient",
  "confidence": 0.0 to 1.0
}

Rules:
- emergency must be true only for life-threatening conditions (chest pain with breathlessness, stroke symptoms, severe bleeding, loss of consciousness, difficulty breathing)
- urgency critical always means emergency true
- confidence reflects how clearly the symptoms map to a specific condition
- suggested_action should be practical and specific to Indian healthcare context
`;

    // AQ. format keys are API keys — must be sent as ?key= query param, not Bearer
    const geminiRes = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errBody);
      return res.status(500).json({ error: 'AI service error. Please try again.', detail: JSON.parse(errBody)?.error?.message });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';


    // Strip markdown code fences if present
    const cleanText = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Gemini JSON parse error:', parseErr, 'Raw:', rawText);
      return res.status(500).json({ error: 'AI response was not in expected format. Please try again.' });
    }

    // Validate required fields
    const requiredFields = ['urgency', 'emergency', 'recommended_specialty', 'suggested_action', 'confidence'];
    for (const field of requiredFields) {
      if (parsed[field] === undefined) {
        return res.status(500).json({ error: 'Incomplete AI response. Please try again.' });
      }
    }

    // SAFETY OVERRIDE — hardcode response for emergencies
    // AI never controls life-threatening messaging
    let override = false;
    if (parsed.emergency === true) {
      parsed.suggested_action = 'Call 112 immediately. Do not drive yourself to the hospital. This may be a life-threatening emergency.';
      override = true;
    }

    // Save to DB
    const dbResult = await pool.query(
      `INSERT INTO triage_results
         (patient_id, symptoms, urgency, emergency, recommended_specialty, suggested_action, confidence, override)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, created_at`,
      [
        patientId,
        symptoms,
        parsed.urgency,
        parsed.emergency,
        parsed.recommended_specialty,
        parsed.suggested_action,
        parsed.confidence,
        override,
      ]
    );

    res.json({
      id: dbResult.rows[0].id,
      urgency: parsed.urgency,
      emergency: parsed.emergency,
      recommended_specialty: parsed.recommended_specialty,
      suggested_action: parsed.suggested_action,
      confidence: parsed.confidence,
      override,
      created_at: dbResult.rows[0].created_at,
    });
  } catch (err) {
    console.error('Triage error:', err.message, err.stack);
    res.status(500).json({ error: 'Triage analysis failed. Please try again.', detail: err.message });
  }
};

// GET /api/triage/history
const getHistory = async (req, res) => {
  const patientId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, symptoms, urgency, emergency, recommended_specialty, suggested_action, created_at
       FROM triage_results
       WHERE patient_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [patientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Triage history error:', err);
    res.status(500).json({ error: 'Failed to fetch triage history.' });
  }
};

module.exports = { analyze, getHistory };
