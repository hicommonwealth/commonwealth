export type FormSubmitValues = {
  tokenChain: string;
  tokenName: string;
  tokenTicker: string;
  tokenDescription: string;
  tokenImageURL: string;
};

export type TokenInformationFormProps = {
  onSubmit: () => void;
  onCancel: () => void;
};
