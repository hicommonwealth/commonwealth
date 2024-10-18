import AddressInfo from 'models/AddressInfo';
import { ReactNode } from 'react';

export type FormSubmitValues = {
  chain: string;
  name: string;
  symbol: string;
  description: string;
  imageURL: string;
};

export type TokenInformationFormProps = {
  onSubmit: (values: FormSubmitValues) => void;
  onCancel: () => void;
  selectedAddress?: AddressInfo;
  onAddressSelected: (address: AddressInfo) => void;
  containerClassName?: string;
  customFooter?: (props: { isProcessingProfileImage: boolean }) => ReactNode;
  forceFormValues?: Partial<FormSubmitValues>;
  focusField?: keyof FormSubmitValues;
  formDisabled?: boolean;
};
