import { useAuth } from '../context/AuthContext';

const SidebarFooter = () => {
  const { user } = useAuth();
  const roleName = user?.role === 'hospital_admin' ? 'Hospital Admin' : 'Patient';

  return (
    <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {user?.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
        <p className="text-[11px] text-gray-500 truncate">{roleName}</p>
      </div>
    </div>
  );
};

export default SidebarFooter;
