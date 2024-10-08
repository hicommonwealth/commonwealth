import { notifyError } from 'controllers/app/notifications';
import { useCallback } from 'react';

type ErrorPayload = Readonly<{
  error: string;
  source: string;
}>;

function isError(e: ErrorPayload | Error): e is Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (e as any).message;
}

export function useMarkdownEditorErrorHandler(): (
  err: ErrorPayload | Error,
) => void {
  // I want to keep this as a hook, so we can *make* it a hook later if we want.
  return useCallback((err) => {
    console.error('Encountered error with editor: ', err);

    const msg = isError(err) ? err.message : err.error;

    notifyError('Encountered error with editor: ' + msg);
  }, []);
}
