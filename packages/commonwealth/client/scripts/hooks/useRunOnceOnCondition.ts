import { useRef } from 'react';
import useNecessaryEffect from './useNecessaryEffect';

type UseRunOnceOnConditionProps = {
  callback: () => void | Promise<() => void>;
  shouldRun: boolean;
};

const useRunOnceOnCondition = ({
  callback,
  shouldRun,
}: UseRunOnceOnConditionProps) => {
  const isRunComplete = useRef(false);

  useNecessaryEffect(() => {
    if (shouldRun && !isRunComplete.current) {
      callback?.()?.catch?.(console.error);
      isRunComplete.current = true;
    }
  }, [callback, shouldRun]);

  return {};
};

export default useRunOnceOnCondition;
