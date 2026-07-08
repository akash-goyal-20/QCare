import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 animate-fade-in">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <MapPin className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-7xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-xs leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors text-sm"
        >
          Back to Home
        </button>
        <button
          onClick={() => navigate('/hospitals')}
          className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          Find Hospitals
        </button>
      </div>
    </div>
  );
};

export default NotFound;
