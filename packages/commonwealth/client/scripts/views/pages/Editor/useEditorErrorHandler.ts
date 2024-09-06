import { notifyError } from 'controllers/app/notifications';

type ErrorPayload = Readonly<{
  error: string;
  source: string;
}>;

export function useEditorErrorHandler(): (err: ErrorPayload) => void {
  // I want to keep this as a hook, so we can *make* it a hook later if we want.
  return (err) => {
    console.error('Encountered error with editor: ', err);
    notifyError('Encountered error with editor: ' + err.error);
  };
}
