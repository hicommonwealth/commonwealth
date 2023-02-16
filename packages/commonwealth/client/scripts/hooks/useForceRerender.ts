import React, { useState, useCallback } from 'react';

const useForceRerender = () => {
  const [, setState] = useState(true);

  const forceRerender = useCallback(() => {
    setState((prevState) => !prevState);
  }, []);

  return forceRerender;
};

export default useForceRerender;
