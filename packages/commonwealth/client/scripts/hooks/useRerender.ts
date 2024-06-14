import useForceRerender from 'hooks/useForceRerender';
import { useEffect } from 'react';

interface UseRerenderProps {
  isActive?: boolean;
  interval: number;
}

const useRerender = ({ isActive, interval }: UseRerenderProps) => {
  const forceRerender = useForceRerender();

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const intervalId = setInterval(() => {
      forceRerender();
    }, interval);

    return () => clearInterval(intervalId);
  }, [forceRerender, interval, isActive]);
};

export default useRerender;
