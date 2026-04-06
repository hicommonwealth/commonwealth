import { useCallback, useState } from 'react';

const useForceRerender = () => {
  const [, setState] = useState({});

  const forceRerender = useCallback(() => {
    setState({});
  }, []);

  return forceRerender;
};

export default useForceRerender;
