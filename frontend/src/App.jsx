import { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import FindHospitals from './pages/FindHospitals';
import HospitalDetail from './pages/HospitalDetail';
import AiTriage from './pages/AiTriage';
import PatientDashboard from './pages/PatientDashboard';
import AdminPortal from './pages/admin/AdminPortal';
import NotFound from './pages/NotFound';

// ── Error Boundary ────────────────────────────────────────────────────────────
// Catches any render crash and shows a recovery UI instead of a blank page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
          <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

// ── Public Route ──────────────────────────────────────────────────────────────
// Accessible only when NOT logged in. Authenticated users are redirected
// to their appropriate dashboard so they can never land on / or /login.
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );
  if (user) {
    return <Navigate to={user.role === 'hospital_admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

// ── Auth Logout Listener ──────────────────────────────────────────────────────
// Listens for the auth:logout event fired by the axios 401 interceptor and
// uses React Router navigate() — no hard reload, no blank screen flash.
const AuthLogoutListener = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handler = () => {
      logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [navigate, logout]);

  return null;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthLogoutListener />
            <div className="animate-fade-in">
              <Routes>
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                <Route path="/hospitals" element={
                  <ProtectedRoute role="patient">
                    <FindHospitals />
                  </ProtectedRoute>
                } />
                <Route path="/hospitals/:id" element={
                  <ProtectedRoute role="patient">
                    <ErrorBoundary>
                      <HospitalDetail />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/triage" element={
                  <ProtectedRoute role="patient">
                    <AiTriage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute role="patient">
                    <ErrorBoundary>
                      <PatientDashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute role="hospital_admin">
                    <AdminPortal />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
