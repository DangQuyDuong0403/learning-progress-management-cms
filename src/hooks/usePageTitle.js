import { useEffect } from 'react';

const usePageTitle = (pageName) => {
  useEffect(() => {
    // Support both string and array of strings
    let title = '';
    if (Array.isArray(pageName)) {
      // Filter out empty/null/undefined values and join with " / "
      title = pageName.filter(Boolean).join(' / ');
    } else {
      title = pageName || '';
    }
    
    document.title = title;
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Camkey';
    };
  }, [pageName]);
};

export default usePageTitle;
