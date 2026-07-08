import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { HeartPulse, Eye, EyeOff } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import { useToast } from '../components/Toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  usePageTitle('Sign In');
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});

  const validateField = (field, value) => {
    if (field === 'name' && tab === 'register' && !value.trim()) {
      return 'Name is required.';
    }
    if (field === 'email' && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return 'Enter a valid email address.';
    }
    if (field === 'password' && value.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    if (field === 'phone' && tab === 'register' && !/^\+?[\d\s-]{10,}$/.test(value)) {
      return 'Enter a valid phone number.';
    }
    return null;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateAll = () => {
    const fields = tab === 'register'
      ? ['name', 'email', 'phone', 'password']
      : ['email', 'password'];
    const newErrors = {};
    const newTouched = {};
    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, form[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateAll()) return;
    setLoading(true);
    try {
      if (tab === 'signin') {
        const res = await api.post('/auth/login', { email: form.email, password: form.password });
        login(res.data.user, res.data.token);
        navigate(res.data.user.role === 'hospital_admin' ? '/admin' : '/dashboard');
      } else {
        const res = await api.post('/auth/register', { name: form.name, email: form.email, password: form.password, phone: form.phone });
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        addToast('Invalid email or password.', 'error');
      } else if (err.response?.status === 429) {
        addToast('Too many login attempts. Please wait a moment.', 'warning');
      } else if (!err.response) {
        addToast('Network error. Please check your connection.', 'error');
      } else {
        addToast(err.response?.data?.error || 'Something went wrong. Please try again.', 'error');
      }
      setApiError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => {
    const isPassword = type === 'password';
    const isVisible = showPasswords[key] || false;
    const inputType = isPassword ? (isVisible ? 'text' : 'password') : type;

    return (
      <div>
        <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">{label}</label>
        <div className={isPassword ? "relative" : undefined}>
          <input
            type={inputType}
            value={form[key]}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({ ...prev, [key]: val }));
              // Clear error as user corrects it (only if already touched)
              if (touched[key]) {
                const err = validateField(key, val);
                setErrors((prev) => ({ ...prev, [key]: err }));
              }
            }}
            onBlur={() => handleBlur(key)}
            placeholder={placeholder}
            className={`w-full border rounded-xl ${isPassword ? 'pl-4 pr-11' : 'px-4'} py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-150 ${
              touched[key] && errors[key]
                ? 'border-red-300 bg-red-50/30 text-red-900 focus:ring-red-500/10 focus:border-red-400'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {touched[key] && errors[key] && (
          <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1.5">
            <span className="w-1 h-1 bg-red-500 rounded-full" />
            {errors[key]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Soft blurred background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-[250px] -translate-y-1/2 w-[400px] h-[400px] bg-blue-100/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 translate-x-[50px] translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[490px] z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary tracking-tight">QCare</span>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[24px] shadow-lg hover:shadow-xl border border-gray-100 p-10 md:p-12 transition-all duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              {tab === 'signin' ? 'Welcome Back' : 'Create your account'}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {tab === 'signin'
                ? 'Sign in to access your healthcare dashboard.'
                : 'Join QCare to book appointments and manage your healthcare.'}
            </p>
          </div>

          {/* Segmented Control / Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl mb-8 border border-gray-100">
            <button
              onClick={() => { setTab('signin'); setErrors({}); setTouched({}); setApiError(''); setShowPasswords({}); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setErrors({}); setTouched({}); setApiError(''); setShowPasswords({}); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {apiError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 animate-fade-in">{apiError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {tab === 'register' && field('name', 'Full Name', 'text', 'Your full name')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {tab === 'register' && field('phone', 'Phone', 'tel', '+91 98765 43210')}
            {field('password', 'Password', 'password', '••••••••')}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all duration-200 active:scale-[0.985] disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-md shadow-primary/10"
            >
              {loading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Please wait...</>
              ) : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

        </div>

        <p className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium flex items-center gap-1.5 mx-auto"
          >
            ← Back to home
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
