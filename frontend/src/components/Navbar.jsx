import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = ({ onLogoClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors pb-0.5 ${
        isActive(to)
          ? 'text-primary border-b-2 border-primary'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-[1010] flex-shrink-0">
      {/* Logo */}
      <Link
        to={user ? (user.role === 'hospital_admin' ? '/admin' : '/dashboard') : '/'}
        onClick={onLogoClick}
        className="flex items-center gap-2 font-bold text-primary text-lg flex-shrink-0"
      >
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <HeartPulse className="w-4 h-4 text-white" />
        </div>
        {user?.role === 'hospital_admin' ? 'QCare Portal' : 'QCare'}
      </Link>

      {/* Center nav — not shown for hospital admins (they have sidebar) */}
      {user?.role !== 'hospital_admin' && (
        <div className="flex items-center gap-6">
          {user && navLink('/dashboard', 'Dashboard')}
          {navLink('/hospitals', 'Find Hospitals')}
          {navLink('/triage', 'AI Triage')}
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{user.name?.[0]?.toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <hr className="border-gray-100" />
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              to="/login"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
