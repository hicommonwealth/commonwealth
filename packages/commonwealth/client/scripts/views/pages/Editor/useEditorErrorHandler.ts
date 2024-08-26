type ErrorPayload = Readonly<{
  error: string;
  source: string;
}>;

export function useEditorErrorHandler(): (err: ErrorPayload) => void {
  return (err) => {
    console.error('Encountered error with editor: ', err);
  };
}
