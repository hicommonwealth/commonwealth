import { useCallback, useEffect, useRef } from 'react';

type UseDeferredConditionTriggerCallbackProps = {
  shouldRunTrigger?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AllowAny = any; // we could get any type of args for a callback and its args/params so need to allow any

// Usecase: When a UI element triggers a callback with args, but we want to run it only when an async condition
// is satisfied. Example: If a button's callback should only run when user is logged in, but at current state
// user is logged out, we can register the button callback with any args it passes and set `shouldRunTrigger` to
// `true` or call the `trigger` method whenever the user login state becomes true to run the original callback.
const useDeferredConditionTriggerCallback = ({
  shouldRunTrigger,
}: UseDeferredConditionTriggerCallbackProps) => {
  const isRunning = useRef(false);
  const registeredCallbackRef = useRef<(args: AllowAny) => void | undefined>();
  const registeredCallbackArgsRef = useRef<AllowAny>();

  const cleanup = useCallback(() => {
    registeredCallbackRef.current = undefined;
    registeredCallbackArgsRef.current = undefined;
    isRunning.current = false;
  }, []);

  const trigger = useCallback(() => {
    if (registeredCallbackRef.current && !isRunning.current) {
      isRunning.current = true;
      registeredCallbackRef.current(registeredCallbackArgsRef.current);
      cleanup();
    }
  }, [cleanup]);

  const register = ({
    cb,
    args,
  }: {
    cb: (args: AllowAny) => void;
    args?: AllowAny;
  }) => {
    registeredCallbackRef.current = cb;
    registeredCallbackArgsRef.current = args;
  };

  useEffect(() => {
    if (shouldRunTrigger) {
      trigger();
    }
  }, [shouldRunTrigger, trigger]);

  return {
    register,
    trigger,
    cleanup,
  };
};

export default useDeferredConditionTriggerCallback;
