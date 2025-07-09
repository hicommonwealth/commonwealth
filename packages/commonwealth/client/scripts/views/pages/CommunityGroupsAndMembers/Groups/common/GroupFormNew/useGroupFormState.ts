import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import { useCallback, useMemo, useState } from 'react';

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

export function useGroupFormState({ mode, initialValue, onSuccess }) {
  // Use the correct schema based on mode
  const schema = mode === 'create' ? CreateGroup.input : UpdateGroup.input;
  const [groupState, setGroupState] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Dirty check
  const isDirty = useMemo(
    () => !deepEqual(groupState, initialValue),
    [groupState, initialValue],
  );

  // Validation
  const parseResult = useMemo(
    () => schema.safeParse(groupState),
    [groupState, schema],
  );
  const isValid = parseResult.success;

  // Submission handler
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setErrors({});
      const result = schema.safeParse(groupState);
      if (!result.success) {
        setErrors(result.error.formErrors.fieldErrors || {});
        setIsSubmitting(false);
        return;
      }
      try {
        // onSuccess should handle the actual mutation
        await onSuccess?.(groupState);
      } finally {
        setIsSubmitting(false);
      }
    },
    [groupState, schema, onSuccess],
  );

  return {
    groupState,
    setGroupState,
    isDirty,
    isValid,
    handleSubmit,
    errors,
    isSubmitting,
  };
}
