import { useRef } from 'react';
import useNecessaryEffect from './useNecessaryEffect';

type UseRunOnceOnConditionProps = {
  callback: () => any | Promise<() => any>;
  shouldRun: boolean;
};

const useRunOnceOnCondition = ({
  callback,
  shouldRun,
}: UseRunOnceOnConditionProps) => {
  const isRunComplete = useRef(false);

  useNecessaryEffect(() => {
    if (shouldRun && !isRunComplete.current) {
      callback?.();
      isRunComplete.current = true;
    }
  }, [callback, shouldRun]);

  return {};
};

export default useRunOnceOnCondition;
