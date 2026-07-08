import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import useWaitTimeSocket from '../hooks/useWaitTimeSocket';
import usePageTitle from '../hooks/usePageTitle';
import ConfirmDialog from '../components/ConfirmDialog';
import Navbar from '../components/Navbar';
import SidebarFooter from '../components/SidebarFooter';
import {
  LayoutDashboard, HeartPulse, CalendarDays,
  Clock, MapPin, Building2
} from 'lucide-react';

const URGENCY_COLORS = {
  low: 'bg-blue-100 text-blue-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  urgent: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};


const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getWaitColor = (mins) => {
  if (mins <= 15) return 'text-green-600';
  if (mins <= 45) return 'text-orange-500';
  return 'text-red-500';
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const DELHI_LAT = 28.6315;
const DELHI_LNG = 77.2167;

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  usePageTitle('Dashboard');

  const [activeNav, setActiveNav] = useState('Dashboard');
  const [bookings, setBookings] = useState([]);
  const [triageHistory, setTriageHistory] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [triageLoading, setTriageLoading] = useState(true);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  // Section 5: confirm cancel dialog
  const [confirmCancel, setConfirmCancel] = useState(null); // { id, doctorName, date }
  const [cancellingId, setCancellingId] = useState(null);
  // Image load error state
  const [cardImageErrors, setCardImageErrors] = useState({});



  const fetchNearbyHospitals = useCallback(async (lat, lng) => {
    setHospitalsLoading(true);
    try {
      const res = await api.get('/hospitals', { params: { lat, lng, radius: 10 } });
      if (res.data.length === 0) {
        // Genuinely nearest search relative to queried coordinates (using 1000 km radius limit)
        const nearestRes = await api.get('/hospitals', { params: { lat, lng, radius: 1000 } });
        setNearbyHospitals(nearestRes.data.slice(0, 4));
      } else {
        setNearbyHospitals(res.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to fetch nearby hospitals:', err);
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/bookings/my').then((r) => setBookings(r.data)).catch(console.error).finally(() => setBookingsLoading(false));
    api.get('/triage/history').then((r) => setTriageHistory(r.data)).catch(console.error).finally(() => setTriageLoading(false));
    
    // Initial load: request user's location permission
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchNearbyHospitals(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        addToast('Location access is required for accurate nearby hospital results.', 'error');
        fetchNearbyHospitals(DELHI_LAT, DELHI_LNG);
      }
    );
  }, [fetchNearbyHospitals, addToast]);

  const handleWsUpdate = useCallback((update) => {
    setNearbyHospitals((prev) =>
      prev.map((h) => h.id === update.hospitalId ? { ...h, wait_time_minutes: update.waitTimeMinutes } : h)
    );
  }, []);
  useWaitTimeSocket(nearbyHospitals[0]?.id || null, handleWsUpdate);
  useWaitTimeSocket(nearbyHospitals[1]?.id || null, handleWsUpdate);
  useWaitTimeSocket(nearbyHospitals[2]?.id || null, handleWsUpdate);
  useWaitTimeSocket(nearbyHospitals[3]?.id || null, handleWsUpdate);

  // Section 5: show confirm dialog before cancelling
  const requestCancel = (booking) => {
    setConfirmCancel({ id: booking.id, doctorName: booking.doctor_name, date: formatDate(booking.slot_date) });
  };

  const executeCancel = async () => {
    if (!confirmCancel) return;
    const { id, doctorName } = confirmCancel;
    setConfirmCancel(null);
    setCancellingId(id);
    try {
      await api.delete(`/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      // Section 1: cancel success toast
      addToast('Appointment cancelled successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel appointment.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, action: () => setActiveNav('Dashboard') },
    { label: 'Find Care', icon: Building2, action: () => navigate('/hospitals') },
    { label: 'AI Triage', icon: HeartPulse, action: () => navigate('/triage') },
    { label: 'My Bookings', icon: CalendarDays, action: () => setActiveNav('My Bookings') },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Navbar onLogoClick={() => setActiveNav('Dashboard')} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ label, icon: Icon, action }) => (
              <button
                key={label}
                onClick={action}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeNav === label
                    ? 'bg-blue-50 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeNav === label ? 'text-primary' : 'text-gray-400'}`} />
                {label}
              </button>
            ))}
          </nav>
          <div className="mx-3 mb-4 bg-primary rounded-xl p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-1">Instant Care</p>
            <p className="font-bold text-sm mb-3">AI Triage Check</p>
            <button onClick={() => navigate('/triage')} className="w-full bg-white text-primary py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
              Start Check
            </button>
          </div>
          <SidebarFooter />
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── Dashboard view ── */}
          {activeNav === 'Dashboard' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
              <p className="text-sm text-gray-500 mb-6">Here is a summary of your health dashboard for today.</p>

              <div className="flex gap-6 mb-6">
                <div className="flex-1 space-y-4">
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {bookingsLoading
                      ? [1,2].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-24 animate-pulse" />)
                      : [
                          { icon: CalendarDays, label: 'Total Bookings', value: bookings.length, badge: bookings.length > 0 ? `+${bookings.length}` : null, bg: 'bg-blue-50 text-blue-600' },
                          { icon: HeartPulse, label: 'Triage Checks', value: triageHistory.length, badge: null, bg: 'bg-orange-50 text-orange-500' },
                        ].map(({ icon: Icon, label, value, badge, bg }) => (
                          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                              {badge && <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-2xl font-bold text-gray-900">{String(value).padStart(2, '0')}</p>
                          </div>
                        ))
                    }
                  </div>

                  {/* Upcoming Bookings */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-900">Upcoming Bookings</h2>
                      <button onClick={() => setActiveNav('My Bookings')} className="text-xs text-primary font-medium hover:underline">View All</button>
                    </div>
                    {bookingsLoading ? (
                      <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                    ) : bookings.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><CalendarDays className="w-6 h-6 text-gray-400" /></div>
                        <p className="text-sm font-medium text-gray-600">No upcoming bookings</p>
                        <p className="text-xs text-gray-400 mt-0.5">Book a slot at a nearby hospital</p>
                        <button onClick={() => navigate('/hospitals')} className="mt-3 text-xs text-primary font-medium hover:underline">Find a Hospital →</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bookings.slice(0, 3).map((b) => (
                          <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                              {b.doctor_name?.split(' ').slice(-1)[0]?.[0] || 'D'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{b.doctor_name}</p>
                              <p className="text-xs text-gray-400 truncate">{b.specialty}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-medium text-gray-700">{formatDate(b.slot_date)}</p>
                              <p className="text-xs text-gray-400">{formatTime(b.slot_time)}</p>
                            </div>
                            {/* Section 5: opens confirm dialog */}
                            <button
                              onClick={() => requestCancel(b)}
                              disabled={cancellingId === b.id}
                              className="text-xs text-red-500 font-medium hover:text-red-700 disabled:opacity-50 flex-shrink-0"
                            >
                              {cancellingId === b.id ? <Spinner /> : 'Cancel'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Triage History */}
                <div className="w-64 flex-shrink-0">
                  <div className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col">
                    <h2 className="font-semibold text-gray-900 mb-4">Triage History</h2>
                    {triageLoading ? (
                      <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                    ) : triageHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><HeartPulse className="w-6 h-6 text-gray-400" /></div>
                        <p className="text-sm font-medium text-gray-600">No triage history</p>
                        <button onClick={() => navigate('/triage')} className="mt-2 text-xs text-primary font-medium hover:underline">Start AI Triage →</button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 flex-1">
                          {triageHistory.slice(0, 3).map((t) => (
                            <div key={t.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-gray-700 truncate max-w-28">
                                  {t.symptoms?.split(' ').slice(0, 4).join(' ')}...
                                </p>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${URGENCY_COLORS[t.urgency] || 'bg-gray-100 text-gray-600'}`}>
                                  {t.urgency?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{Math.floor((Date.now() - new Date(t.created_at)) / 3600000)}h ago</p>
                              <p className="text-xs text-primary mt-1">{t.emergency ? '⚠ Emergency Override' : '✓ AI-Verified'}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Nearby Hospitals */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Nearby Hospitals</h2>
                  <button onClick={() => navigate('/hospitals')} className="text-xs text-primary font-medium hover:underline">View all →</button>
                </div>
                {hospitalsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map((i) => <div key={i} className="bg-white rounded-xl border h-44 animate-pulse" />)}
                  </div>
                ) : nearbyHospitals.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><MapPin className="w-6 h-6 text-gray-400" /></div>
                    <p className="text-sm font-medium text-gray-600">No hospitals found nearby</p>
                    <button onClick={() => navigate('/hospitals')} className="mt-2 text-xs text-primary font-medium hover:underline">Browse all →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {nearbyHospitals.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => navigate(`/hospitals/${h.id}`)}
                        className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      >
                        <div className="relative h-36 bg-gray-100 overflow-hidden flex items-center justify-center">
                          <span className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                          {(!h.image_url || cardImageErrors[h.id]) ? (
                            <Building2 className="w-10 h-10 text-gray-300" />
                          ) : (
                            <img
                              src={h.image_url}
                              alt={h.name}
                              className="w-full h-full object-cover"
                              onError={() => setCardImageErrors(prev => ({ ...prev, [h.id]: true }))}
                            />
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{h.name}</h4>
                            <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{h.distance_km} km</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 truncate">{h.address}</p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={`text-xs font-semibold ${
                              h.wait_time_minutes < 20 ? 'text-green-600' :
                              h.wait_time_minutes <= 45 ? 'text-orange-500' : 'text-red-500'
                            }`}>
                              {h.wait_time_minutes} mins wait
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── My Bookings view ── */}
          {activeNav === 'My Bookings' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
              {bookingsLoading ? (
                <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-white border rounded-xl animate-pulse" />)}</div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><CalendarDays className="w-8 h-8 text-gray-400" /></div>
                  <h3 className="text-gray-700 font-medium mb-1">No bookings yet</h3>
                  <p className="text-gray-400 text-sm">Find a hospital and book your first slot.</p>
                  <button onClick={() => navigate('/hospitals')} className="mt-4 text-primary text-sm font-medium hover:underline">Find a Hospital →</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow duration-200">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {b.doctor_name?.split(' ').slice(-1)[0]?.[0] || 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{b.doctor_name}</p>
                        <p className="text-xs text-gray-500">{b.specialty} · {b.hospital_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{formatDate(b.slot_date)}</p>
                        <p className="text-xs text-gray-400">{formatTime(b.slot_time)}</p>
                      </div>
                      <button
                        onClick={() => requestCancel(b)}
                        disabled={cancellingId === b.id}
                        className="text-xs text-red-500 font-medium hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-red-50 transition-colors"
                      >
                        {cancellingId === b.id ? <Spinner /> : 'Cancel'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Profile view ── */}
          {activeNav === 'Profile' && (
            <div className="max-w-md">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
                {[
                  { label: 'Full Name', value: user?.name },
                  { label: 'Email', value: user?.email },
                  { label: 'Role', value: 'Patient' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Section 5: Confirm cancel dialog */}
      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your appointment with ${confirmCancel?.doctorName} on ${confirmCancel?.date}?`}
        confirmText="Yes, Cancel"
        cancelText="Keep It"
        variant="danger"
        onConfirm={executeCancel}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
};

export default PatientDashboard;
