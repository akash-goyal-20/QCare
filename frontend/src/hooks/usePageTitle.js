import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | QCare` : 'QCare - Know Before You Go';
    return () => {
      document.title = 'QCare - Know Before You Go';
    };
  }, [title]);
};

export default usePageTitle;
