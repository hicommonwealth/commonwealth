import { useCallback, useMemo } from 'react';

export function useDefaultAuthCallbacks() {
  const handleSuccess = useCallback(() => {
    console.log('success!');
    const landingURL = new URL('/', window.location.href).toString();
    document.location.href = landingURL;
  }, []);

  const handleError = useCallback((err: Error) => {
    console.log('error: ', err);
  }, []);

  return useMemo(() => {
    return {
      onSuccess: handleSuccess,
      onError: handleError,
    };
  }, [handleError, handleSuccess]);
}
