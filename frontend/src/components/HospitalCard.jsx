import { useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import WaitTimeBadge from './WaitTimeBadge';

const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const mins = Math.floor((Date.now() - new Date(timestamp)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

const HospitalCard = ({ hospital, selected, onClick }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
        selected ? 'border-primary shadow-md ring-1 ring-primary' : 'border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{hospital.name}</h3>
        <span className="text-xs text-gray-400 whitespace-nowrap ml-2 flex items-center gap-0.5">
          <MapPin className="w-3 h-3" />{hospital.distance_km} km
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-2 truncate">{hospital.address}</p>
      <div className="flex items-center gap-2 mb-2">
        <WaitTimeBadge minutes={hospital.wait_time_minutes} />
        <span className="text-xs text-gray-400 flex items-center gap-0.5">
          <Clock className="w-3 h-3" />Updated {getTimeAgo(hospital.last_updated)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {hospital.specialties?.slice(0, 2).map((s) => (
          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {s}
          </span>
        ))}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); navigate(`/hospitals/${hospital.id}`); }}
        className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        Book Slot
      </button>
    </div>
  );
};

export default HospitalCard;
