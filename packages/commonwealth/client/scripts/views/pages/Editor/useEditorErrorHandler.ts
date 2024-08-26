type ErrorPayload = Readonly<{
  error: string;
  source: string;
}>;

function useEditorErrorHandler(): (err: ErrorPayload) => void {
  return (err) => {
    console.error('Encountered error with editor: ', err);
  };
}
