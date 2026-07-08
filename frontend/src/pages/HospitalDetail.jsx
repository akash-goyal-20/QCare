import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import WaitTimeBadge from '../components/WaitTimeBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import useWaitTimeSocket from '../hooks/useWaitTimeSocket';
import usePageTitle from '../hooks/usePageTitle';
import {
  Building2, Microscope, BedDouble, MapPin, Phone, Star,
  Clock, Users, CheckCircle2, ArrowLeft
} from 'lucide-react';

const TABS = ['Overview', 'Specialties', 'Book a Slot'];

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const HospitalDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [hospital, setHospital] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    setImageErrors({});
  }, [id]);

  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Section 7: page title
  usePageTitle(hospital?.name);

  useEffect(() => {
    setLoading(true);
    api.get(`/hospitals/${id}`)
      .then((res) => setHospital(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedDoctor) return;
    setSlotsLoading(true);
    api.get('/hospitals/slots', { params: { doctorId: selectedDoctor.id, date: selectedDate } })
      .then((res) => setSlots(res.data))
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
    setSelectedSlot(null);
  }, [selectedDoctor, selectedDate]);

  // Pulse the wait-time badge briefly when WS sends an update
  const [justUpdated, setJustUpdated] = useState(false);
  const pulseTimerRef = useRef(null);

  const handleWsUpdate = useCallback((update) => {
    setHospital((h) =>
      h ? { ...h, wait_time_minutes: update.waitTimeMinutes, available_beds: update.availableBeds } : h
    );
    setJustUpdated(true);
    // Clear any previous pulse timer before starting a new one
    clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setJustUpdated(false), 2000);
  }, []);

  // Clean up pulse timer on unmount
  useEffect(() => () => clearTimeout(pulseTimerRef.current), []);

  useWaitTimeSocket(id ? parseInt(id) : null, handleWsUpdate);

  const handleBooking = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedSlot) return;
    setBookingLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      await api.post('/bookings', {
        slotId: selectedSlot.id,
        doctorId: selectedDoctor.id,
        hospitalId: hospital.id,
      }, { headers: { 'Idempotency-Key': idempotencyKey } });

      // Success — show toast and grey out the booked slot. Stay on current tab.
      const dateLabel = new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      addToast(`Appointment booked with ${selectedDoctor.name} on ${dateLabel} at ${selectedSlot.slot_time?.slice(0, 5)}`, 'success');

      // Mark the booked slot as unavailable in local state so it greys out immediately
      setSlots((prev) => prev.map((s) => s.id === selectedSlot.id ? { ...s, is_booked: true } : s));

      // Clear only the slot selection — keep doctor and date so user can pick another slot
      setSelectedSlot(null);
      // Do NOT change tab or doctor — avoids any re-render race that blanks the screen
    } catch (err) {
      const msg = err.response?.data?.error || 'Booking failed.';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('taken')) {
        addToast('This slot was just taken. Please choose another.', 'error');
      } else if (err.response?.status === 429) {
        addToast('Too many requests. Please wait a moment.', 'warning');
      } else if (!err.response) {
        addToast('Connection error. Please check your internet.', 'error');
      } else {
        addToast(msg, 'error');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const bedPct = hospital ? Math.round((hospital.available_beds / hospital.total_beds) * 100) : 0;

  const datechips = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return {
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading hospital details...</div>
      </div>
    </div>
  );

  if (!hospital) return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Hospital not found.</p>
          <button onClick={() => navigate('/hospitals')} className="mt-3 text-primary text-sm font-medium hover:underline">← Back to hospitals</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Title row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {hospital.name}
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{hospital.address}</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{hospital.phone}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {hospital.is_accepting ? (
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full" />Currently accepting patients
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200">
                <span className="w-2 h-2 bg-red-500 rounded-full" />Not accepting patients
              </span>
            )}
            {/* Section 8.1: Wait time badge with pulse ring on WS update */}
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" /> OPD Wait:
              <span className={`ml-1 transition-all duration-500 ${justUpdated ? 'ring-2 ring-green-400 ring-offset-1 rounded' : ''}`}>
                <WaitTimeBadge minutes={hospital.wait_time_minutes} />
              </span>
            </p>
          </div>
        </div>

        {/* Image placeholders */}
        {(!hospital.gallery_image_1 && !hospital.gallery_image_2) ? (
          <div className="grid grid-cols-3 gap-3 h-[320px] mb-6">
            <div className="col-span-3 h-[320px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {(!hospital.image_url || imageErrors.main) ? (
                <Building2 className="w-16 h-16 text-gray-300" />
              ) : (
                <img
                  src={hospital.image_url}
                  alt={hospital.name}
                  className="w-full h-full object-cover object-center"
                  onError={() => setImageErrors(prev => ({ ...prev, main: true }))}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 h-[320px] mb-6">
            <div className="col-span-2 h-[320px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {(!hospital.image_url || imageErrors.main) ? (
                <Building2 className="w-16 h-16 text-gray-300" />
              ) : (
                <img
                  src={hospital.image_url}
                  alt={hospital.name}
                  className="w-full h-full object-cover object-center"
                  onError={() => setImageErrors(prev => ({ ...prev, main: true }))}
                />
              )}
            </div>
            <div className="flex flex-col gap-3 h-[320px]">
              <div className="h-[154px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {(!hospital.gallery_image_1 || imageErrors.g1) ? (
                  <Microscope className="w-10 h-10 text-gray-300" />
                ) : (
                  <img
                    src={hospital.gallery_image_1}
                    alt={`${hospital.name} gallery 1`}
                    className="w-full h-full object-cover object-center"
                    onError={() => setImageErrors(prev => ({ ...prev, g1: true }))}
                  />
                )}
              </div>
              <div className="h-[154px] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                {(!hospital.gallery_image_2 || imageErrors.g2) ? (
                  <BedDouble className="w-10 h-10 text-gray-300" />
                ) : (
                  <img
                    src={hospital.gallery_image_2}
                    alt={`${hospital.name} gallery 2`}
                    className="w-full h-full object-cover object-center"
                    onError={() => setImageErrors(prev => ({ ...prev, g2: true }))}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'Overview' && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: Clock, label: 'ER Wait', value: `${hospital.wait_time_minutes}m` },
                { icon: BedDouble, label: 'ICU Beds', value: `${hospital.available_beds} Free` },
                { icon: Users, label: 'Bed Capacity', value: `${bedPct}%` },
                { icon: Star, label: 'Rating', value: `${hospital.rating}/5` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="border border-gray-200 rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-xl font-bold text-primary">{value}</p>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">About {hospital.name}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {hospital.about || 'A premier multi-speciality healthcare institution dedicated to clinical excellence and patient-centered care, equipped with state-of-the-art diagnostic and surgical technologies.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {['ISO Certified', '24/7 Pharmacy', 'Trauma Level I'].map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Specialties */}
        {tab === 'Specialties' && (
          <div className="space-y-3">
            {(!hospital.specialties || hospital.specialties.length === 0) && (
              <div className="flex flex-col items-center py-10 text-center">
                <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm">No specialties listed.</p>
              </div>
            )}
            {hospital.specialties?.map((s) => (
              <div key={s} className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-gray-800">{s}</span>
                <div className="flex gap-2 flex-wrap">
                  {hospital.doctors?.filter((d) => d.specialty === s).map((d) => (
                    <span key={d.id} className={`text-xs px-2 py-1 rounded-full font-medium ${d.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {d.name} {d.available ? '● Available' : '○ Unavailable'}
                    </span>
                  ))}
                  {hospital.doctors?.filter((d) => d.specialty === s).length === 0 && (
                    <span className="text-xs text-gray-400">No doctors listed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Book a Slot — Section 4 */}
        {tab === 'Book a Slot' && (
          <div className="space-y-6">
            {!user && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
                Please <button onClick={() => navigate('/login')} className="underline font-medium">log in</button> to book a slot.
              </div>
            )}

            {/* Step 1 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 1 — Select Doctor</p>
              <div className="grid grid-cols-2 gap-3">
                {hospital.doctors?.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { if (d.available) { setSelectedDoctor(d); setSelectedSlot(null); } }}
                    disabled={!d.available}
                    className={`text-left border rounded-xl px-4 py-3 transition-all hover:shadow-sm ${selectedDoctor?.id === d.id ? 'border-primary bg-blue-50 ring-1 ring-primary' :
                      d.available ? 'border-gray-200 hover:border-primary' :
                        'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{d.name.split(' ').slice(-1)[0][0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.name} {d.qualification && <span className="text-[10px] text-gray-400 font-normal">({d.qualification})</span>}</p>
                        <p className="text-xs text-gray-500">{d.specialty} {d.experience ? `• ${d.experience} yrs exp` : ''}</p>
                        {d.consultation_fee ? <p className="text-[10px] text-primary font-medium mt-0.5">OPD Fee: ₹{d.consultation_fee}</p> : null}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${d.available ? 'text-green-600' : 'text-gray-400'}`}>
                      {d.available ? '● Available' : '○ Unavailable'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — date chips */}
            {selectedDoctor && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 2 — Select Date</p>
                <div className="flex gap-2 flex-wrap">
                  {datechips.map((chip) => (
                    <button
                      key={chip.value}
                      onClick={() => setSelectedDate(chip.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedDate === chip.value ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary'
                        }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — slot grid */}
            {selectedDoctor && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 3 — Select Time Slot</p>
                {slotsLoading ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.id}
                        disabled={s.is_booked}
                        onClick={() => !s.is_booked && setSelectedSlot(s)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${s.is_booked ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through' :
                          selectedSlot?.id === s.id ? 'bg-primary text-white' :
                            'border border-gray-200 text-gray-700 hover:border-primary'
                          }`}
                      >
                        {s.slot_time?.slice(0, 5)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Booking summary */}
            {selectedSlot && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Booking Summary</p>
                <div className="space-y-1.5 text-sm mb-4">
                  <p><span className="text-gray-500">Doctor:</span> <strong>{selectedDoctor.name}</strong></p>
                  <p><span className="text-gray-500">Specialty:</span> {selectedDoctor.specialty}</p>
                  <p><span className="text-gray-500">Date:</span> {selectedDate}</p>
                  <p><span className="text-gray-500">Time:</span> {selectedSlot.slot_time?.slice(0, 5)}</p>
                  <p><span className="text-gray-500">Hospital:</span> {hospital.name}</p>
                </div>
                {/* Section 8.2: loading spinner on confirm button */}
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || !user}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bookingLoading ? <><Spinner />Booking...</> : 'Confirm Booking'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 py-4 px-6 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
        <span>QCare Health Systems</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-600">HIPAA Compliance</a>
          <a href="#" className="hover:text-gray-600">Contact Support</a>
        </div>
      </footer>
    </div>
  );
};

export default HospitalDetail;
