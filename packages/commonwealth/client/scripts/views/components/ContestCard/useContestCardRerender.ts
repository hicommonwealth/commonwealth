import { useEffect } from 'react';
import useForceRerender from 'shared/hooks/useForceRerender';

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

    const intervalId = setInterval(() => {
      forceRerender();
    }, interval);

    return () => clearInterval(intervalId);
  }, [forceRerender, interval, isActive]);
};

export default useContestCardRerender;
