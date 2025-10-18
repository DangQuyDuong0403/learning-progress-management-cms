import { useEffect } from 'react';

const usePageTitle = (pageName) => {
  useEffect(() => {
    document.title = pageName || '';
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Camkey';
    };
  }, [pageName]);
};

export default usePageTitle;
