const WaitTimeBadge = ({ minutes }) => {
  const getColor = (m) => {
    if (m < 20) return 'bg-green-100 text-green-700';
    if (m <= 45) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getColor(minutes)}`}>
      {minutes < 20 ? `< ${minutes}m` : minutes <= 45 ? `${minutes}m` : `> ${minutes}m`}
    </span>
  );
};

export default WaitTimeBadge;
