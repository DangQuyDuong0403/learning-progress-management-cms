import { useEffect } from 'react';

const usePageTitle = (pageName) => {
  useEffect(() => {
    const baseTitle = 'Camkeylpms';
    const fullTitle = pageName ? `${baseTitle} - ${pageName}` : baseTitle;
    
    document.title = fullTitle;
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [pageName]);
};

export default usePageTitle;
