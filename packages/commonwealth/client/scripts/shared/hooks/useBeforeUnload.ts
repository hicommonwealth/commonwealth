import { useEffect } from 'react';

const useBeforeUnload = (enabled = true) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (enabled) {
        event.preventDefault();
        event.returnValue = true;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);
};

export default useBeforeUnload;
