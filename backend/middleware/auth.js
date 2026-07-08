const jwt = require('jsonwebtoken');

// Protect any route — verifies JWT
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, hospitalId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Restrict to hospital_admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'hospital_admin') {
    return res.status(403).json({ error: 'Hospital admin access required.' });
  }
  next();
};

// Restrict to patient only
const patientOnly = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access required.' });
  }
  next();
};

module.exports = { protect, adminOnly, patientOnly };
