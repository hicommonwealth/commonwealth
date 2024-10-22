import AddressInfo from 'models/AddressInfo';
import { ReactNode } from 'react';

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
  containerClassName?: string;
  customFooter?: (props: { isProcessingProfileImage: boolean }) => ReactNode;
};
