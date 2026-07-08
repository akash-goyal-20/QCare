import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HeartPulse, Clock, ShieldCheck, CalendarDays, MapPin,
  CheckCircle2, Building2, ChevronDown, UserCheck, Star,
  ArrowRight, Shield, Stethoscope, Users, Activity, Check
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  usePageTitle(null); // → 'QCare — Know Before You Go'

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const FAQS = [
    {
      q: "How accurate is the AI Triage?",
      a: "QCare's AI symptom assessment is designed for informational triage using advanced medical guidelines. It helps you understand the urgency of your symptoms and recommends matching specialties, but is not a substitute for professional medical advice."
    },
    {
      q: "How are hospital wait times calculated?",
      a: "Wait times are updated directly by hospital administration desks and staff. They reflect the actual average waiting duration for walk-in OPD consultations or ER triage in real-time."
    },
    {
      q: "Can I cancel my booked appointment slot?",
      a: "Yes. Patients can cancel appointments at any time from their Dashboard page. Once cancelled, the slot is immediately released and made available for other patients."
    },
    {
      q: "Is my personal healthcare data secure?",
      a: "Absolutely. We employ strict end-to-end encryption protocols. All triage logs, clinical questionnaires, and booking details are secured, conforming to general safety standards."
    },
    {
      q: "How can a hospital partner with QCare?",
      a: "Hospital representatives can sign up or reach out to our team to get a verified Hospital Profile. Once authenticated, admins can configure slots, departments, and live status tickers."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased selection:bg-primary/10 selection:text-primary">

      {/* Sticky Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-100/85 sticky top-0 bg-white/85 backdrop-blur-md z-50 transition-all duration-300">
        <div className="flex items-center gap-2 font-bold text-primary text-xl cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          QCare
        </div>
        <div className="hidden md:flex items-center gap-7">
          {[
            { name: 'Features', id: 'features' },
            { name: 'How It Works', id: 'how-it-works' },
            { name: 'Why Choose QCare', id: 'why-qcare' },
            { name: 'Hospital Portal', id: 'hospital-portal' },
            { name: 'Testimonials', id: 'testimonials' },
            { name: 'FAQ', id: 'faq' }
          ].map((item) => (
            <button
              key={item.name}
              onClick={() => scrollToSection(item.id)}
              className="text-xs font-bold text-slate-500 hover:text-primary tracking-wider uppercase transition-colors"
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-extrabold text-slate-600 hover:text-primary transition-colors px-3 py-2"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white text-xs font-extrabold px-5 py-3 rounded-xl hover:bg-primary-dark shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden min-h-[calc(100vh-70px)] py-20 lg:py-0 flex items-center bg-white"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #f1f5f9 2px, transparent 0)', backgroundSize: '32px 32px' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-6xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-extrabold uppercase tracking-[0.15em]">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              Revolutionizing Patient Queue Times
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4">
              Know Before <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">You Go.</span>
            </h1>
            <p className="text-slate-550 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-semibold">
              Avoid overcrowded ERs and urgent care waiting rooms. QCare provides real-time wait times and AI-powered symptom assessment to get you care faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <button
                onClick={() => user ? navigate('/hospitals') : navigate('/login')}
                className="bg-primary text-white px-8 py-4 rounded-xl font-extrabold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
              >
                Find Hospitals Near Me <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => user?.role === 'hospital_admin' ? navigate('/admin') : navigate('/login')}
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-8 py-4 rounded-xl font-extrabold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                For Hospitals
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-bold pt-6">
              {['Free for patients', '500+ Partner Hospitals', 'Real-time Wait Updates'].map((t) => (
                <span key={t} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />{t}
                </span>
              ))}
            </div>
          </div>

          {/* Right side - browser mockup */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-800 transition-all hover:scale-[1.01] duration-300">
              <div className="bg-slate-850 rounded-2xl border border-slate-800/80 overflow-hidden bg-white">
                <div className="bg-slate-50 flex items-center gap-1.5 px-4 py-3.5 border-b border-slate-100">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                  <div className="flex-1 bg-white rounded-lg border border-slate-100 px-3 py-1.5 text-[10px] text-slate-400 font-semibold ml-3 select-none">
                    qcare.in/hospitals/nearby
                  </div>
                </div>
                <div className="p-5 space-y-4 bg-slate-50/50 min-h-60">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Live ER Status</p>
                  {[
                    { name: 'AIIMS Delhi', wait: '12m', beds: '45 Beds Free', color: 'bg-green-50 text-green-700 border-green-150', tag: 'Normal' },
                    { name: 'Sir Ganga Ram Hospital', wait: '8m', beds: '30 Beds Free', color: 'bg-green-50 text-green-700 border-green-150', tag: 'Fastest' },
                    { name: 'Safdarjung Hospital', wait: '35m', beds: '20 Beds Free', color: 'bg-amber-50 text-amber-700 border-amber-150', tag: 'Moderate' },
                  ].map((h) => (
                    <div key={h.name} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/5 rounded-xl flex items-center justify-center">
                          <Building2 className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-850">{h.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{h.beds}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${h.color} mb-1`}>
                          {h.wait} wait
                        </span>
                        <p className="text-[9px] font-semibold text-slate-400">{h.tag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen py-24 md:py-32 px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Platform Features</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] pt-1">
              Everything You Need for <span className="text-primary">Smarter Care</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">Skip the wait times, assess your medical symptoms instantly, and secure your place in the patient queue.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Precision Live Wait Times',
                desc: 'OPD and emergency room wait statistics updated in real-time by partnering hospital staff. Know estimated waits before departing home.',
                color: 'text-primary bg-primary/10'
              },
              {
                icon: HeartPulse,
                title: 'AI Symptom Triage',
                desc: 'Describe your discomfort in natural language. Powered by Gemini API to evaluate urgency indexes and direct you to suitable specialties.',
                color: 'text-indigo-600 bg-indigo-50'
              },
              {
                icon: CalendarDays,
                title: 'Instant Queue Booking',
                desc: 'Secure verified OPD booking slots with absolute ease. Double-booking protected via robust backend database lock logic.',
                color: 'text-teal-600 bg-teal-50'
              }
            ].map((f) => (
              <div key={f.title} className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:border-slate-200/50 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${f.color} transition-transform group-hover:scale-105`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-850 mb-4">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
                <div className="pt-8">
                  <button
                    onClick={() => user ? navigate('/hospitals') : navigate('/login')}
                    className="text-xs font-bold text-primary group-hover:text-primary-dark inline-flex items-center gap-1 transition-colors"
                  >
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 md:py-32 px-8 bg-white border-y border-slate-100 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">User Journey</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] pt-1">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">Follow three easy steps to consult with specialized doctors quickly and efficiently.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 relative">
            {[
              {
                num: '01',
                icon: Stethoscope,
                title: 'Assess Symptoms',
                desc: 'Describe what you feel to our AI assistant. Get instantly triaged with safety checks and recommended medical specialties.'
              },
              {
                num: '02',
                icon: MapPin,
                title: 'Locate Hospitals',
                desc: 'Filter verified clinics and hospitals near you sorted by distance and live OPD queue timelines.'
              },
              {
                num: '03',
                icon: CheckCircle2,
                title: 'Book & Skip waiting',
                desc: 'Select an available time slot, complete your profile booking, and arrive right on schedule.'
              }
            ].map((s, idx) => (
              <div key={s.title} className="text-center relative space-y-5">
                {idx < 2 && (
                  <div className="hidden md:block absolute top-14 left-2/3 w-1/2 h-[2px] bg-slate-100 z-0" />
                )}
                <div className="relative z-10 w-20 h-20 bg-slate-50 text-slate-600 rounded-3xl flex items-center justify-center mx-auto border border-slate-100 group hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300">
                  <s.icon className="w-8 h-8" />
                  <span className="absolute -top-3 -right-3 text-[11px] font-black bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-white">
                    {s.num}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-xl pt-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose QCare Section */}
      <section id="why-qcare" className="min-h-screen py-24 md:py-32 px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Why QCare</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] pt-1">
              Redefining the <span className="text-primary">Healthcare Experience</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">We provide an interface designed to connect patients and hospitals seamlessly.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'AI Symptom Assessments', desc: 'Pre-evaluate symptoms safely via Gemini LLM before you go.', icon: Activity },
              { title: 'Real-Time OPD Indicators', desc: 'Staff updated metrics showing exact queue delays in minutes.', icon: Clock },
              { title: 'Smart Slot Configuration', desc: 'Secure consultations and cancel bookings at the click of a button.', icon: CalendarDays },
              { title: 'Zero Overcrowding', desc: 'Spread OPD volume evenly to allow comfortable care delivery.', icon: Users },
              { title: 'Security Standardized', desc: 'Compliant data storage keeping healthcare history private.', icon: Shield },
              { title: 'Better Clinic Experience', desc: 'Streamlined scheduling ensures faster clinical processing.', icon: UserCheck }
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-100 rounded-3xl p-7 flex items-start gap-5 hover:shadow-lg transition-all duration-300 hover:border-slate-200/50">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-850 mb-2">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Portal Showcase Section */}
      <section id="hospital-portal" className="min-h-screen py-24 md:py-32 px-8 bg-slate-900 text-white relative overflow-hidden flex items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-6">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Hospital Portal</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-[1.15]">
              QCare for <span className="text-primary">Care Providers</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg">
              Manage operations efficiently, publish waiting indicators, allocate doctor calendars, and handle patient queue schedules inside a unified dashboard.
            </p>
            <div className="space-y-4 pt-2">
              {[
                'Add, edit, and coordinate Doctor rosters',
                'Create and manage patient OPD consultation slots',
                'Real-time wait times broadcasting to public map',
                'Bed count and ICU status tracking',
                'Accept or cancel appointments with automatic sync'
              ].map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-slate-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => user?.role === 'hospital_admin' ? navigate('/admin') : navigate('/login')}
                className="bg-primary text-white hover:bg-primary-dark text-xs font-bold px-7 py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/25"
              >
                Access Portal Dashboard
              </button>
            </div>
          </div>

          {/* Right side - dashboard showcase image placeholder */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700/60 shadow-2xl">
              <div className="bg-slate-900 rounded-2xl p-5 space-y-4 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verified Admin Portal</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-750" />
                    <span className="w-2 h-2 rounded-full bg-slate-750" />
                  </div>
                </div>

                {/* Stats block */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Wait Time', val: '12m', tag: 'Normal', color: 'text-green-400' },
                    { label: 'ICU Vacancy', val: '08/30', tag: 'Available', color: 'text-primary' },
                    { label: 'Total Doctors', val: '14 Active', tag: 'Online', color: 'text-white' }
                  ].map((x) => (
                    <div key={x.label} className="bg-slate-850 rounded-xl p-3 border border-slate-800">
                      <p className="text-[9px] text-slate-500 font-semibold uppercase">{x.label}</p>
                      <p className={`text-sm font-bold mt-1 ${x.color}`}>{x.val}</p>
                      <p className="text-[8px] text-slate-400 font-medium mt-0.5">{x.tag}</p>
                    </div>
                  ))}
                </div>

                {/* Queue list preview */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 space-y-3">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Queue Schedule</p>
                  {[
                    { pat: 'Anil Kumar', doc: 'Dr. Rajesh Kumar', spec: 'Cardiology', time: '10:00 AM', status: 'Confirmed' },
                    { pat: 'Sunita Mishra', doc: 'Dr. Sunita Sharma', spec: 'Neurology', time: '11:30 AM', status: 'Confirmed' }
                  ].map((b) => (
                    <div key={b.pat} className="flex justify-between items-center text-[10px] border-b border-slate-800/60 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-slate-200">{b.pat}</p>
                        <p className="text-[9px] text-slate-500">{b.doc} • {b.spec}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-300">{b.time}</p>
                        <span className="text-[8px] bg-blue-500/10 text-primary px-1.5 py-0.5 rounded font-semibold mt-0.5 inline-block">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="min-h-screen py-24 md:py-32 px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] pt-1">
              Loved by <span className="text-primary">Patients Nationwide</span>
            </h2>
            <p className="text-slate-550 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">Read the stories of people who saved hours of waiting using QCare.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rajesh Kumar',
                role: 'Patient',
                review: 'QCare completely transformed my ER experience. I checked AIIMS wait time, booked a slot, and was seen within 15 minutes of arrival!',
                stars: 5
              },
              {
                name: 'Anjali Sharma',
                role: 'Mother of two',
                review: 'The AI triage gave me the reassurance I needed when my child had a sudden high fever at night. Recommended the right department instantly.',
                stars: 5
              },
              {
                name: 'Devendra Mehta',
                role: 'Patient',
                review: 'As someone managing chronic cardiology appointments, booking slots through QCare saves me hours of waiting in line.',
                stars: 5
              }
            ].map((t) => (
              <div key={t.name} className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:border-slate-200/50 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed italic">"{t.review}"</p>
                </div>
                <div className="flex items-center gap-3 pt-6 mt-8 border-t border-slate-50">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-extrabold text-primary">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-400 font-semibold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section id="faq" className="min-h-[90vh] py-24 md:py-32 px-8 bg-white border-y border-slate-100 flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <p className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-[0.2em]">FAQ</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15] pt-1">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed pt-2">Have questions about the platform? Find answers below.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 bg-slate-50/30 hover:border-slate-200/50"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-850 text-sm md:text-base hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  <div
                    className="transition-all duration-300 ease-in-out overflow-hidden"
                    style={{ maxHeight: isOpen ? '250px' : '0' }}
                  >
                    <div className="p-6 pt-0 text-slate-500 text-sm leading-relaxed border-t border-slate-50 bg-white">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-24 md:py-32 px-8 bg-white text-center relative overflow-hidden flex items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-3xl mx-auto w-full relative z-10 space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ready to Experience <br className="hidden md:block" />
            <span className="text-primary">Overcrowd-Free Care?</span>
          </h2>
          <p className="text-slate-550 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of smart patients skipping long waiting lines and assessing symptoms accurately before visiting ER clinics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => user ? navigate('/triage') : navigate('/login')}
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              Start AI Triage
            </button>
            <button
              onClick={() => user ? navigate('/hospitals') : navigate('/login')}
              className="w-full sm:w-auto border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              Find Nearby Hospitals
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20 px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-2 font-bold text-white text-xl">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              QCare
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Providing modern queue allocation, live OPD metrics broadcasting, and symptom triage for patients and hospitals across India.
            </p>
          </div>
          {[
            { title: 'Product', links: [{ name: 'Find Hospitals', path: '/hospitals' }, { name: 'AI Triage', path: '/triage' }, { name: 'Hospital Portal', path: '/login' }, { name: 'How It Works', id: 'how-it-works' }] },
            { title: 'Support', links: [{ name: 'Contact Us', path: '#' }, { name: 'Help Center', path: '#' }, { name: 'Report Issues', path: '#' }] },
          ].map((col) => (
            <div key={col.title} className="space-y-4">
              <p className="text-xs font-extrabold text-white uppercase tracking-widest">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.name}>
                    {l.id ? (
                      <button
                        onClick={() => scrollToSection(l.id)}
                        className="text-xs text-slate-450 hover:text-white transition-colors"
                      >
                        {l.name}
                      </button>
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (l.path.startsWith('/')) {
                            if (l.path === '/login') navigate('/login');
                            else user ? navigate(l.path) : navigate('/login');
                          }
                        }}
                        className="text-xs text-slate-450 hover:text-white transition-colors"
                      >
                        {l.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <p>© 2026 QCare Health Systems. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'HIPAA Consent'].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
