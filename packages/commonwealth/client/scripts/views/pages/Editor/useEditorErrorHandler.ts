type ErrorPayload = Readonly<{
  error: string;
  source: string;
}>;

export function useEditorErrorHandler(): (err: ErrorPayload) => void {
  // I want to keep this as a hook so we can *make* it a hook later if we want.
  // I think the errors should probably be tied into snackbar errors which will
  // probably need to be a hook.  Right now we just console.log it but we're
  // going to change it to use a snackbar for errors.
  return (err) => {
    console.error('Encountered error with editor: ', err);
  };
}
