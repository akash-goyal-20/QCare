const express = require('express');
const router = express.Router();
const {
  searchHospitals,
  getHospitalById,
  updateHospitalStatus,
  getSlots,
  updateHospitalInfo,
} = require('../controllers/hospital.controller');
const {
  getDoctors,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorSlots,
  createSlots,
  deleteSlot,
} = require('../controllers/doctor.controller');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/', searchHospitals);
router.get('/slots', getSlots);
router.get('/:id', getHospitalById);

// Admin only
router.patch('/:id/status', protect, adminOnly, updateHospitalStatus);
router.patch('/:id/info', protect, adminOnly, updateHospitalInfo);

// Doctor CRUD
router.get('/:id/doctors', protect, adminOnly, getDoctors);
router.post('/:id/doctors', protect, adminOnly, addDoctor);
router.put('/:id/doctors/:docId', protect, adminOnly, updateDoctor);
router.delete('/:id/doctors/:docId', protect, adminOnly, deleteDoctor);

// Slot management
router.get('/:id/doctors/:docId/slots', protect, adminOnly, getDoctorSlots);
router.post('/:id/slots', protect, adminOnly, createSlots);
router.delete('/:id/slots/:slotId', protect, adminOnly, deleteSlot);

module.exports = router;
