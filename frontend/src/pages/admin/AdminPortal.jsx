import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import usePageTitle from '../../hooks/usePageTitle';
import Navbar from '../../components/Navbar';
import SidebarFooter from '../../components/SidebarFooter';
import {
  LayoutDashboard, CalendarDays, BedDouble, Settings,
  RefreshCw, Clock, AlertTriangle, HeartPulse,
  Stethoscope, Plus, Trash2, Edit, Check, X, ChevronRight
} from 'lucide-react';

const SPECIALTIES_LIST = [
  'Emergency', 'Pediatrics', 'Cardiology', 'OB/GYN',
  'Neurology', 'Orthopedics', 'Diagnostics', 'General Practice',
];

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const AdminPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  usePageTitle('Hospital Portal');

  const [hospital, setHospital] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [activeNav, setActiveNav] = useState('Hospital Dashboard');
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Stats / Status States
  const [waitTime, setWaitTime] = useState('');
  const [bedCount, setBedCount] = useState('');
  const [activeSpecialties, setActiveSpecialties] = useState([]);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  // Settings inputs
  const [aboutInput, setAboutInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [gallery1Input, setGallery1Input] = useState('');
  const [gallery2Input, setGallery2Input] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Doctor CRUD States
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialty: 'General Practice',
    qualification: '',
    experience: '',
    consultation_fee: '',
    working_hours: '09:00-17:00',
    available: true,
  });

  // Slot generation inputs
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('17:00');
  const [slotInterval, setSlotInterval] = useState('30');
  const [slotLoading, setSlotLoading] = useState(false);

  // Appointment filters
  const [apptFilter, setApptFilter] = useState('All');

  const hospitalId = user?.hospitalId;

  const todayCount = bookings.filter((b) => {
    if (!b.slot_date) return false;
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    let createdAtLocal = '';
    if (b.created_at) {
      const cd = new Date(b.created_at);
      const cy = cd.getFullYear();
      const cm = String(cd.getMonth() + 1).padStart(2, '0');
      const cd_day = String(cd.getDate()).padStart(2, '0');
      createdAtLocal = `${cy}-${cm}-${cd_day}`;
    }

    return b.slot_date === today || createdAtLocal === today;
  }).length;

  const loadData = () => {
    if (!hospitalId) return;
    setLoading(true);
    Promise.all([
      api.get(`/hospitals/${hospitalId}`),
      api.get('/bookings/admin'),
      api.get(`/hospitals/${hospitalId}/doctors`),
    ]).then(([hRes, bRes, dRes]) => {
      setHospital(hRes.data);
      setWaitTime(hRes.data.wait_time_minutes);
      setBedCount(hRes.data.available_beds);
      setActiveSpecialties(hRes.data.specialties || []);
      setBookings(bRes.data);
      setDoctors(dRes.data);
      // Init settings input
      setAboutInput(hRes.data.about || '');
      setImageInput(hRes.data.image_url || '');
      setGallery1Input(hRes.data.gallery_image_1 || '');
      setGallery2Input(hRes.data.gallery_image_2 || '');
      setEmailInput(hRes.data.contact_email || '');
      setPhoneInput(hRes.data.phone || '');
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  // Fetch slots whenever the selected doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      fetchDoctorSlots(selectedDoctor.id);
    } else {
      setDoctorSlots([]);
    }
  }, [selectedDoctor]);

  const fetchDoctorSlots = async (docId) => {
    try {
      const res = await api.get(`/hospitals/${hospitalId}/doctors/${docId}/slots`);
      setDoctorSlots(res.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch doctor slots.', 'error');
    }
  };

  const toggleSpecialty = (s) =>
    setActiveSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const executeUpdate = async () => {
    setShowConfirmUpdate(false);
    setUpdateLoading(true);
    try {
      const res = await api.patch(`/hospitals/${hospitalId}/status`, {
        wait_time_minutes: parseInt(waitTime),
        available_beds: parseInt(bedCount),
        specialties: activeSpecialties,
      });
      setHospital(res.data);
      addToast('Live status updated. Patients can now see new wait times.', 'success');
    } catch (err) {
      if (err.response?.status === 429) {
        addToast('Too many requests. Please wait a moment.', 'warning');
      } else {
        addToast(err.response?.data?.error || 'Update failed. Please try again.', 'error');
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  // Hospital Info patch
  const handleUpdateHospitalInfo = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.patch(`/hospitals/${hospitalId}/info`, {
        about: aboutInput,
        image_url: imageInput,
        contact_email: emailInput,
        phone: phoneInput,
        gallery_image_1: gallery1Input,
        gallery_image_2: gallery2Input,
      });
      setHospital(res.data);
      addToast('Hospital information updated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update hospital info.', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Doctor functions
  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: '',
      specialty: 'General Practice',
      qualification: '',
      experience: '',
      consultation_fee: '',
      working_hours: '09:00-17:00',
      available: true,
    });
    setShowDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setDoctorForm({
      name: doc.name,
      specialty: doc.specialty,
      qualification: doc.qualification || '',
      experience: doc.experience || '',
      consultation_fee: doc.consultation_fee || '',
      working_hours: doc.working_hours || '09:00-17:00',
      available: doc.available,
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...doctorForm,
        experience: doctorForm.experience ? parseInt(doctorForm.experience) : 0,
        consultation_fee: doctorForm.consultation_fee ? parseInt(doctorForm.consultation_fee) : 0,
      };

      if (editingDoctor) {
        const res = await api.put(`/hospitals/${hospitalId}/doctors/${editingDoctor.id}`, payload);
        setDoctors(prev => prev.map(d => d.id === editingDoctor.id ? { ...d, ...res.data } : d));
        if (selectedDoctor?.id === editingDoctor.id) {
          setSelectedDoctor({ ...selectedDoctor, ...res.data });
        }
        addToast('Doctor details updated successfully.', 'success');
      } else {
        const res = await api.post(`/hospitals/${hospitalId}/doctors`, payload);
        setDoctors(prev => [...prev, res.data]);
        addToast('Doctor added successfully.', 'success');
      }
      setShowDoctorModal(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save doctor.', 'error');
    }
  };

  const handleDeleteDoctor = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this doctor? All associated slots and schedule settings will be deleted.')) return;
    try {
      await api.delete(`/hospitals/${hospitalId}/doctors/${docId}`);
      setDoctors(prev => prev.filter(d => d.id !== docId));
      if (selectedDoctor?.id === docId) {
        setSelectedDoctor(null);
      }
      addToast('Doctor deleted successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete doctor.', 'error');
    }
  };

  // Slot functions
  const handleBulkCreateSlots = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (!slotDate || !slotStartTime || !slotEndTime) {
      addToast('Please fill all slot parameters.', 'warning');
      return;
    }
    setSlotLoading(true);
    try {
      const res = await api.post(`/hospitals/${hospitalId}/slots`, {
        doctorId: selectedDoctor.id,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        intervalMinutes: parseInt(slotInterval),
      });
      addToast(`Successfully created ${res.data.created} slots.`, 'success');
      fetchDoctorSlots(selectedDoctor.id);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create slots.', 'error');
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await api.delete(`/hospitals/${hospitalId}/slots/${slotId}`);
      setDoctorSlots(prev => prev.filter(s => s.id !== slotId));
      addToast('Slot deleted successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete slot.', 'error');
    }
  };

  // Booking status update
  const handleUpdateBookingStatus = async (apptId, status) => {
    try {
      const res = await api.patch(`/bookings/${apptId}/status`, { status });
      setBookings(prev => prev.map(b => b.id === apptId ? { ...b, status: res.data.status } : b));
      addToast(`Appointment marked as ${status}.`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update appointment status.', 'error');
    }
  };

  const isStale = hospital && (Date.now() - new Date(hospital.last_updated)) > 4 * 3600000;

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeFromTimeStr = (timeStr) => {
    if (!timeStr) return '';
    // Format "09:00:00" to "09:00 AM/PM"
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatSlotDate = (dateStr) => {
    if (!dateStr) return '';
    // Case 1: Simple date string (like '2026-07-12')
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // Case 2: ISO string (like '2026-07-11T18:30:00.000Z')
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-gray-400 text-sm">Loading admin portal...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Navbar onLogoClick={() => setActiveNav('Hospital Dashboard')} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {[
              { label: 'Hospital Dashboard', icon: LayoutDashboard },
              { label: 'Appointments', icon: CalendarDays },
              { label: 'Doctors', icon: Stethoscope },
              { label: 'Bed Management', icon: BedDouble },
              { label: 'Settings', icon: Settings },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveNav(label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeNav === label
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                  }`}
              >
                <Icon className={`w-4 h-4 ${activeNav === label ? 'text-primary' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </nav>
          <SidebarFooter />
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Dashboard View */}
            {activeNav === 'Hospital Dashboard' && (
              <>
                {isStale && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium">
                      <strong>Live Status Not Updated:</strong> Wait times have not been refreshed in over 4 hours. Please update now.
                    </p>
                  </div>
                )}

                {/* 3 real stat cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      icon: CalendarDays,
                      label: "TODAY'S BOOKINGS",
                      value: todayCount || bookings.length,
                      sub: bookings.length > 0 ? `${bookings.length} total` : 'No bookings yet',
                      subColor: 'text-gray-500',
                    },
                    {
                      icon: Clock,
                      label: 'CURRENT WAIT TIME',
                      value: `${hospital?.wait_time_minutes ?? '—'}m`,
                      sub: hospital?.wait_time_minutes <= 20 ? 'Low' : hospital?.wait_time_minutes <= 45 ? 'Moderate' : 'High',
                      subColor: hospital?.wait_time_minutes <= 20 ? 'text-green-600' : hospital?.wait_time_minutes <= 45 ? 'text-orange-500' : 'text-red-500',
                    },
                    {
                      icon: BedDouble,
                      label: 'AVAILABLE BEDS',
                      value: hospital?.available_beds ?? '—',
                      sub: hospital ? `of ${hospital.total_beds} total` : '',
                      subColor: 'text-gray-500',
                    },
                  ].map(({ icon: Icon, label, value, sub, subColor }) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                      </div>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        <span className={`text-xs font-medium mb-1 ${subColor}`}>{sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two columns */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Update Live Status */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Update Live Status</h2>
                      <button onClick={() => loadData()} className="text-gray-400 hover:text-primary transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">ER Wait Time (Minutes)</label>
                        <input
                          type="number" min="0" max="300"
                          value={waitTime}
                          onChange={(e) => setWaitTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Bed Vacancy Count</label>
                        <input
                          type="number" min="0"
                          value={bedCount}
                          onChange={(e) => setBedCount(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Active Specialties</label>
                        <div className="grid grid-cols-2 gap-2">
                          {SPECIALTIES_LIST.map((s) => (
                            <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={activeSpecialties.includes(s)}
                                onChange={() => toggleSpecialty(s)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={updateLoading}
                        onClick={() => setShowConfirmUpdate(true)}
                        className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {updateLoading ? <><Spinner />Updating...</> : 'Update Live Data'}
                      </button>
                    </div>
                  </div>

                  {/* Active Bookings preview */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Active Bookings</h2>
                      <span className="text-xs text-gray-400">{bookings.length} total</span>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <CalendarDays className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No active bookings</p>
                        <p className="text-xs text-gray-400 mt-0.5">Bookings will appear when patients schedule appointments.</p>
                      </div>
                    ) : (
                      <>
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                              <th className="text-left pb-2 font-semibold">Patient</th>
                              <th className="text-left pb-2 font-semibold">Doctor</th>
                              <th className="text-left pb-2 font-semibold">Time</th>
                              <th className="text-left pb-2 font-semibold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.slice(0, 6).map((b) => (
                              <tr key={b.id} className="border-b border-gray-50 text-sm hover:bg-gray-50 transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                                      {b.patient_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <span className="font-medium text-gray-900 truncate max-w-20">{b.patient_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 text-xs text-gray-600 truncate max-w-20">{b.doctor_name}</td>
                                <td className="py-3 text-xs text-gray-600">{formatSlotDate(b.slot_date)} at {formatTimeFromTimeStr(b.slot_time)}</td>
                                <td className="py-3">
                                  <button onClick={() => setActiveNav('Appointments')} className="text-xs text-primary font-medium hover:underline">Manage</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {bookings.length > 6 && (
                          <p className="mt-3 text-xs text-center text-gray-400">+ {bookings.length - 6} more</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Appointments / Bookings Tab */}
            {activeNav === 'Appointments' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Patient Appointments</h2>
                    <p className="text-sm text-gray-500">View and update appointment status</p>
                  </div>
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {['All', 'confirmed', 'completed', 'cancelled'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setApptFilter(tab)}
                        className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${apptFilter === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <th className="pb-3 font-semibold">Patient</th>
                        <th className="pb-3 font-semibold">Doctor</th>
                        <th className="pb-3 font-semibold">Department</th>
                        <th className="pb-3 font-semibold">Date & Time</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings
                        .filter((b) => apptFilter === 'All' || b.status === apptFilter)
                        .map((b) => (
                          <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-4 font-semibold text-gray-900">{b.patient_name}</td>
                            <td className="py-4 text-gray-700">{b.doctor_name}</td>
                            <td className="py-4 text-gray-600">{b.specialty}</td>
                            <td className="py-4 text-gray-600">
                              {formatSlotDate(b.slot_date)} at {formatTimeFromTimeStr(b.slot_time)}
                            </td>
                            <td className="py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                  b.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="py-4 text-right space-x-2">
                              {b.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                                    className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                    className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {b.status !== 'confirmed' && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      {bookings.filter((b) => apptFilter === 'All' || b.status === apptFilter).length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-gray-400">
                            No appointments found matching this filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Doctors and Slots Tab */}
            {activeNav === 'Doctors' && (
              <div className="grid grid-cols-3 gap-6">
                {/* Doctor List */}
                <div className="col-span-1 bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Doctors</h3>
                    <button
                      onClick={handleOpenAddDoctor}
                      className="flex items-center gap-1 bg-primary text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {doctors.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoctor(doc)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${selectedDoctor?.id === doc.id
                            ? 'border-primary bg-blue-50/50 shadow-sm'
                            : 'border-gray-100 hover:bg-gray-50'
                          }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.specialty}</p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Slots: {doc.available_slots ?? 0} / {doc.total_slots ?? 0}
                          </p>
                        </div>
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditDoctor(doc)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {doctors.length === 0 && (
                      <p className="text-center py-6 text-xs text-gray-400">No doctors added yet.</p>
                    )}
                  </div>
                </div>

                {/* Slot Management for Selected Doctor */}
                <div className="col-span-2 space-y-6">
                  {selectedDoctor ? (
                    <>
                      {/* Doctor Header & Summary */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{selectedDoctor.name}</h3>
                            <p className="text-sm text-primary font-medium">{selectedDoctor.specialty}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedDoctor.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {selectedDoctor.available ? 'Accepting Appointments' : 'On Leave'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                          <div>
                            <p className="text-gray-400 uppercase font-semibold">Qualification</p>
                            <p className="text-gray-800 font-medium">{selectedDoctor.qualification || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase font-semibold">Experience</p>
                            <p className="text-gray-800 font-medium">{selectedDoctor.experience ? `${selectedDoctor.experience} Years` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase font-semibold">Fee / OPD Rate</p>
                            <p className="text-gray-800 font-medium">₹ {selectedDoctor.consultation_fee || '0'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bulk Generate Slots */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="font-bold text-sm text-gray-900 mb-4">Bulk Create Booking Slots</h4>
                        <form onSubmit={handleBulkCreateSlots} className="grid grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Date</label>
                            <input
                              type="date"
                              required
                              min={(() => {
                                const d = new Date();
                                const year = d.getFullYear();
                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                              })()}
                              value={slotDate}
                              onChange={(e) => setSlotDate(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                            <input
                              type="time"
                              required
                              value={slotStartTime}
                              onChange={(e) => setSlotStartTime(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Time</label>
                            <input
                              type="time"
                              required
                              value={slotEndTime}
                              onChange={(e) => setSlotEndTime(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <button
                              type="submit"
                              disabled={slotLoading}
                              className="w-full bg-primary text-white py-2 rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {slotLoading ? <Spinner /> : <Plus className="w-3.5 h-3.5" />}
                              Generate
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Existing Slots */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="font-bold text-sm text-gray-900 mb-4">Doctor's Schedule / Slots</h4>
                        <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {doctorSlots.map((s) => (
                            <div
                              key={s.id}
                              className={`p-2.5 rounded-lg border flex flex-col justify-between items-start gap-1 relative overflow-hidden text-xs ${s.is_booked
                                  ? 'border-amber-100 bg-amber-50/50'
                                  : 'border-gray-100 bg-gray-50/30'
                                }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-gray-700">{formatTimeFromTimeStr(s.slot_time)}</span>
                                {!s.is_booked && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlot(s.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded-md"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">{formatSlotDate(s.slot_date)}</span>
                              {s.is_booked && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-semibold px-1 py-0.5 rounded uppercase mt-1 max-w-full truncate">
                                  Booked: {s.patient_name}
                                </span>
                              )}
                            </div>
                          ))}
                          {doctorSlots.length === 0 && (
                            <p className="col-span-4 text-center py-8 text-xs text-gray-400">
                              No slots configured for this doctor yet. Choose date/time inputs above to add slots.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <Stethoscope className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm font-semibold text-gray-600">No Doctor Selected</p>
                      <p className="text-xs text-gray-400 mt-1">Select a doctor from the list on the left to manage slots and schedule.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bed Management Tab (Availability) */}
            {activeNav === 'Bed Management' && (
              <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Availability Management</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">ER / OPD Wait Time (Minutes)</label>
                    <input
                      type="number" min="0" max="300"
                      value={waitTime}
                      onChange={(e) => setWaitTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Available Beds Count</label>
                    <input
                      type="number" min="0"
                      value={bedCount}
                      onChange={(e) => setBedCount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
                    <p className="font-semibold text-gray-700 mb-1">Total Licensed Beds</p>
                    <p>{hospital?.total_beds || 0} configured beds. Total beds can only be adjusted by the platform admins.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Hospital Specialties & Departments</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALTIES_LIST.map((s) => (
                        <label key={s} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeSpecialties.includes(s)}
                            onChange={() => toggleSpecialty(s)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={updateLoading}
                    onClick={() => setShowConfirmUpdate(true)}
                    className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {updateLoading ? <Spinner /> : 'Save Availability & Specialties'}
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeNav === 'Settings' && (
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Read-Only Panel */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Read-Only Hospital Specifications</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Hospital Name</label>
                      <input
                        type="text"
                        disabled
                        value={hospital?.name || ''}
                        className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Hospital ID</label>
                      <input
                        type="text"
                        disabled
                        value={hospital?.id || ''}
                        className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Location Address</label>
                      <textarea
                        disabled
                        value={hospital?.address || ''}
                        className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed resize-none h-16"
                      />
                    </div>
                  </div>
                </div>

                {/* Editable Specifications */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Editable Hospital Specifications</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">About / Description</label>
                      <textarea
                        value={aboutInput}
                        onChange={(e) => setAboutInput(e.target.value)}
                        placeholder="Add brief details about the hospital services and history..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-28"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Main Hospital Image URL</label>
                      <input
                        type="url"
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        placeholder="https://example.com/main-image.jpg"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Gallery Image URL 1</label>
                        <input
                          type="url"
                          value={gallery1Input}
                          onChange={(e) => setGallery1Input(e.target.value)}
                          placeholder="https://example.com/gallery1.jpg"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Gallery Image URL 2</label>
                        <input
                          type="url"
                          value={gallery2Input}
                          onChange={(e) => setGallery2Input(e.target.value)}
                          placeholder="https://example.com/gallery2.jpg"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Contact Phone</label>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+91-1234567890"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Contact Email</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="contact@hospital.org"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={settingsLoading}
                      onClick={handleUpdateHospitalInfo}
                      className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {settingsLoading ? <Spinner /> : 'Save Hospital specifications'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="bg-white border-t border-gray-100 py-3 px-6 text-xs text-gray-400 flex justify-between flex-shrink-0">
            <span>QCare © 2026 QCare Health Systems.</span>
            <div className="flex gap-4">
              {['Privacy Policy', 'Terms of Service', 'Contact Support'].map((l) => (
                <a key={l} href="#" className="hover:text-gray-600">{l}</a>
              ))}
            </div>
          </footer>
        </div>
      </div>

      {/* Doctor Add/Edit modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingDoctor ? 'Edit Doctor Details' : 'Add New Doctor'}
              </h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveDoctor} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Name"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Specialty / Department</label>
                <select
                  value={doctorForm.specialty}
                  onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                >
                  {SPECIALTIES_LIST.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Qualification</label>
                <input
                  type="text"
                  placeholder="MBBS, MD, etc."
                  value={doctorForm.qualification}
                  onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={doctorForm.experience}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">OPD Rate / Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="500"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Working Hours</label>
                <input
                  type="text"
                  placeholder="09:00-17:00"
                  value={doctorForm.working_hours}
                  onChange={(e) => setDoctorForm({ ...doctorForm, working_hours: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="docAvail"
                  checked={doctorForm.available}
                  onChange={(e) => setDoctorForm({ ...doctorForm, available: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="docAvail" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Available for new bookings
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold text-center hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-semibold text-center hover:bg-primary-dark transition-colors"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm update dialog */}
      <ConfirmDialog
        isOpen={showConfirmUpdate}
        title="Update Live Status"
        message="This will immediately update wait times and bed availability visible to all patients viewing your hospital."
        confirmText="Update Now"
        cancelText="Cancel"
        onConfirm={executeUpdate}
        onCancel={() => setShowConfirmUpdate(false)}
      />
    </div>
  );
};

export default AdminPortal;
