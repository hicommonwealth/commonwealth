import useForceRerender from 'hooks/useForceRerender';
import { useEffect } from 'react';

interface UseContestCardRerenderProps {
  isActive?: boolean;
  interval: number;
}

const useContestCardRerender = ({
  isActive,
  interval,
}: UseContestCardRerenderProps) => {
  const forceRerender = useForceRerender();

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Trigger an immediate rerender, then continue on the interval.
    forceRerender();

    const intervalId = setInterval(() => {
      forceRerender();
    }, interval);

    return () => clearInterval(intervalId);
  }, [forceRerender, interval, isActive]);
};

export default useContestCardRerender;
