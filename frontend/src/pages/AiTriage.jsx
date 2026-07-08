import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import usePageTitle from '../hooks/usePageTitle';
import { HeartPulse, ShieldCheck, CheckCircle2, AlertTriangle, Siren } from 'lucide-react';

const URGENCY_CONFIG = {
  low: { label: 'LOW', color: 'bg-blue-100 text-blue-700', border: 'border-blue-300' },
  moderate: { label: 'MODERATE', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-300' },
  urgent: { label: 'URGENT', color: 'bg-orange-100 text-orange-700', border: 'border-orange-300' },
  critical: { label: 'CRITICAL', color: 'bg-red-100 text-red-700', border: 'border-red-400' },
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const AiTriage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle('AI Triage');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [inlineError, setInlineError] = useState('');
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Fix 11: inline validation
    if (symptoms.trim().length < 10) {
      setInlineError('Please describe your symptoms in more detail (at least 10 characters).');
      return;
    }
    setInlineError('');
    setApiError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/triage', { symptoms });
      setResult(res.data);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? (URGENCY_CONFIG[result.urgency] || URGENCY_CONFIG.low) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="flex gap-8">
          {/* Main Form */}
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <HeartPulse className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">How are you feeling?</h1>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Describe your symptoms in detail for our clinical AI to provide an initial assessment.
                </p>

                <div className="relative mb-1">
                  <textarea
                    value={symptoms}
                    onChange={(e) => { setSymptoms(e.target.value); if (inlineError) setInlineError(''); }}
                    rows={6}
                    maxLength={1000}
                    placeholder="e.g., I've had a sharp pain in my chest that started an hour ago, and I'm feeling slightly short of breath..."
                    className={`w-full border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary text-gray-800 placeholder-gray-400 ${inlineError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-300">{symptoms.length}/1000</span>
                </div>

                {/* Fix 11: inline error — not alert */}
                {inlineError && <p className="text-xs text-red-600 mb-4 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{inlineError}</p>}

                {apiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{apiError}</div>
                )}


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Spinner />Analyzing symptoms...</> : <><HeartPulse className="w-4 h-4" />Assess My Symptoms</>}
                </button>
              </div>
            </form>

            {/* Result */}
            {result && cfg && (
              <div className={`mt-6 p-6 rounded-2xl border-2 ${result.emergency ? 'border-red-500 bg-red-50' : result.urgency === 'urgent' || result.urgency === 'critical' ? 'border-orange-400 bg-orange-50' : 'border-green-400 bg-green-50'}`}>
                {result.emergency && (
                  <div className="flex items-center gap-2 mb-4">
                    <Siren className="w-6 h-6 text-red-600" />
                    <span className="text-red-700 font-bold text-lg">EMERGENCY — Call 112 Immediately</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-sm text-gray-600">Recommended: <strong>{result.recommended_specialty}</strong></span>
                  <span className="text-xs text-gray-400 ml-auto">Confidence: {Math.round(result.confidence * 100)}%</span>
                </div>
                <p className="text-gray-800 font-medium text-sm leading-relaxed">{result.suggested_action}</p>
                {result.override && (
                  <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />Safety override applied
                  </p>
                )}
                <button onClick={() => navigate('/hospitals')} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                  Find Nearby Hospitals →
                </button>
                {!user && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-blue-700">
                      Sign in to save your triage history and book an appointment.
                    </p>
                    <button onClick={() => navigate('/login')} className="ml-4 text-sm font-semibold text-primary hover:underline flex-shrink-0">
                      Sign In →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-4">
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Clinical Precision</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                Our AI is trained on millions of clinical cases and validated by board-certified physicians.
              </p>
              <ul className="space-y-1">
                {['HIPAA Compliant', 'Real-time analysis', 'Emergency override'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="mx-6 mb-8 max-w-5xl mx-auto">
        <div className="border-2 border-red-300 rounded-xl bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Medical Disclaimer</p>
              <p className="text-xs text-red-700 leading-relaxed">
                QCare AI Triage is for informational purposes only and does not constitute medical advice, diagnosis, or treatment.
                If you are experiencing a life-threatening emergency, call 112 immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTriage;
