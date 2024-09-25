import AddressInfo from 'models/AddressInfo';

export type FormSubmitValues = {
  tokenChain: string;
  tokenName: string;
  tokenTicker: string;
  tokenDescription: string;
  tokenImageURL: string;
};

export type TokenInformationFormProps = {
  onSubmit: (values: FormSubmitValues) => void;
  onCancel: () => void;
  selectedAddress?: AddressInfo;
  onAddressSelected: (address: AddressInfo) => void;
};
