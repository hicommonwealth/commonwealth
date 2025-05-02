import { useRef } from 'react';

export function useValueRef<Value>(value: Value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
