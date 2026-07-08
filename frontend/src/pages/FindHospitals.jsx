import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Search, MapPin, Clock, Navigation, SlidersHorizontal } from 'lucide-react';
import HospitalCard from '../components/HospitalCard';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import useWaitTimeSocket from '../hooks/useWaitTimeSocket';
import usePageTitle from '../hooks/usePageTitle';
import { useToast } from '../components/Toast';


const DELHI_LAT = 28.6315;
const DELHI_LNG = 77.2167;

const SPECIALTIES = [
  'All', 'Cardiology', 'Emergency', 'Pediatrics',
  'Diagnostics', 'General Practice', 'Neurology', 'Orthopedics', 'Gynecology',
];

const getMarkerColor = (mins) => {
  if (mins < 20) return '#22c55e';
  if (mins <= 45) return '#f97316';
  return '#ef4444';
};

// Pans map when center/zoom changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 0.8 });
  }, [center?.[0], center?.[1], zoom]);
  return null;
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between mb-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-10" />
    </div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
    <div className="h-6 bg-gray-200 rounded w-24 mb-3" />
    <div className="h-9 bg-gray-200 rounded" />
  </div>
);

const FindHospitals = () => {
  usePageTitle('Find Hospitals');
  const { addToast } = useToast();

  const [hospitals, setHospitals] = useState([]);
  const [mapCenter, setMapCenter] = useState([DELHI_LAT, DELHI_LNG]);
  const [mapZoom, setMapZoom] = useState(12);
  const [specialty, setSpecialty] = useState('All');
  const [rawSearch, setRawSearch] = useState('');    // immediate input value
  const [search, setSearch] = useState('');           // debounced value
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(10);
  const [sortBy, setSortBy] = useState('distance');   // Section 3.1: sort
  const [userCoords, setUserCoords] = useState(null);
  const [hasExpandedSearch, setHasExpandedSearch] = useState(false);
  const cardRefs = useRef({});
  const searchDebounce = useRef(null);

  // Section 3.3: debounce search input 300ms
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setSearch(rawSearch), 300);
    return () => clearTimeout(searchDebounce.current);
  }, [rawSearch]);

  const fetchHospitals = useCallback(async (lat, lng, spec, rad) => {
    setLoading(true);
    setHasExpandedSearch(false);
    try {
      const res = await api.get('/hospitals', { params: { lat, lng, radius: rad, specialty: spec } });
      if (res.data.length === 0) {
        // Genuinely nearest search relative to queried coordinates (using 1000 km radius limit)
        const nearestRes = await api.get('/hospitals', { params: { lat, lng, radius: 1000, specialty: spec } });
        setHospitals(nearestRes.data);
        if (nearestRes.data.length > 0) {
          setHasExpandedSearch(true);
        }
        setMapCenter([lat, lng]);
      } else {
        setHospitals(res.data);
        setMapCenter([lat, lng]);
      }
    } catch (err) {
      console.error('Hospital fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: request user's location permission
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        fetchHospitals(latitude, longitude, specialty, radius);
      },
      () => {
        addToast('Location access is required for accurate nearby hospital results.', 'error');
        fetchHospitals(DELHI_LAT, DELHI_LNG, specialty, radius);
      }
    );
  }, []);


  // Real-time wait time updates
  const handleWsUpdate = useCallback((update) => {
    setHospitals((prev) =>
      prev.map((h) =>
        h.id === update.hospitalId
          ? { ...h, wait_time_minutes: update.waitTimeMinutes, available_beds: update.availableBeds, last_updated: update.lastUpdated }
          : h
      )
    );
  }, []);
  useWaitTimeSocket(hospitals[0]?.id || null, handleWsUpdate);

  // Card click → pan map
  const handleCardClick = (hospital) => {
    setSelectedId(hospital.id);
    setMapCenter([hospital.lat, hospital.lng]);
    setMapZoom(14);
  };

  // Marker click → scroll card into view
  const handleMarkerClick = (hospital) => {
    setSelectedId(hospital.id);
    const ref = cardRefs.current[hospital.id];
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Section 3.1: client-side sort + search filter
  const filtered = useMemo(() => {
    let result = hospitals.filter((h) =>
      search ? h.name.toLowerCase().includes(search.toLowerCase()) : true
    );
    result = [...result].sort((a, b) => {
      if (sortBy === 'distance') return (a.distance_km || 0) - (b.distance_km || 0);
      if (sortBy === 'wait_time') return a.wait_time_minutes - b.wait_time_minutes;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'beds') return b.available_beds - a.available_beds;
      return 0;
    });
    return result;
  }, [hospitals, search, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Left Panel ── */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', background: 'white', overflow: 'hidden' }}>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Search by name or location"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Specialty chips */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSpecialty(s); fetchHospitals(mapCenter[0], mapCenter[1], s, radius); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    specialty === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Radius chips */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-shrink-0">Radius:</span>
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                onClick={() => { setRadius(r); fetchHospitals(mapCenter[0], mapCenter[1], specialty, r); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  radius === r ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Section 3.1: Sort dropdown + Section 3.4: count label */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-550">
              {loading ? (
                'Searching...'
              ) : hasExpandedSearch ? (
                <span className="text-amber-600 font-medium">
                  No hospitals within {radius} km. Showing nearest:
                </span>
              ) : (
                `${filtered.length} hospital${filtered.length !== 1 ? 's' : ''} within ${radius} km`
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="distance">Nearest First</option>
                <option value="wait_time">Shortest Wait</option>
                <option value="rating">Highest Rated</option>
                <option value="beds">Most Beds</option>
              </select>
            </div>
          </div>

          {/* Hospital list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }} className="space-y-3">
            {loading ? (
              <>{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <MapPin className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">No hospitals found</p>
                <p className="text-xs text-gray-400 mt-1 mb-3">Try expanding the radius</p>
                <button
                  onClick={() => { setRadius(50); fetchHospitals(mapCenter[0], mapCenter[1], specialty, 50); }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Expand to 50 km →
                </button>
              </div>
            ) : (
              filtered.map((h) => (
                <div key={h.id} ref={(el) => (cardRefs.current[h.id] = el)}>
                  <HospitalCard
                    hospital={h}
                    selected={selectedId === h.id}
                    onClick={() => handleCardClick(h)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Map Panel ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {filtered.map((h) => (
              <CircleMarker
                key={h.id}
                center={[h.lat, h.lng]}
                radius={selectedId === h.id ? 16 : 12}
                fillColor={getMarkerColor(h.wait_time_minutes)}
                color={selectedId === h.id ? '#1D4ED8' : 'white'}
                weight={selectedId === h.id ? 3 : 2}
                fillOpacity={0.9}
                eventHandlers={{ click: () => handleMarkerClick(h) }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]}>
                  <span style={{ fontWeight: 600, fontFamily: 'Inter' }}>{h.wait_time_minutes}m</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-6 left-4 bg-white rounded-xl border border-gray-200 shadow-md p-4 z-[1000]">
            <p className="text-xs font-semibold text-gray-700 mb-2">Wait Time Legend</p>
            {[
              { color: '#22c55e', label: 'Low', sub: '< 20 min' },
              { color: '#f97316', label: 'Medium', sub: '20–45 min' },
              { color: '#ef4444', label: 'High', sub: '> 45 min' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 mb-1 last:mb-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-700">{item.label}</span>
                <span className="text-xs text-gray-400">{item.sub}</span>
              </div>
            ))}
          </div>

          {/* Locate button */}
          <button
            onClick={() => {
              if (userCoords) {
                setMapCenter([userCoords.lat, userCoords.lng]);
                setMapZoom(14);
              } else {
                setMapCenter([DELHI_LAT, DELHI_LNG]);
                setMapZoom(12);
                addToast('Location access is required for accurate nearby hospital results.', 'error');
              }
            }}
            className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg p-2.5 shadow-md z-[1000] hover:bg-gray-50 transition-colors"
            title={userCoords ? 'Center on my location' : 'Reset to Delhi'}
          >
            <Navigation className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindHospitals;
