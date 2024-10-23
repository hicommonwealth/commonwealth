import AddressInfo from 'models/AddressInfo';
import { ReactNode } from 'react';
import { UploadControlProps } from 'views/components/component_kit/CWImageInput';

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
  onFormUpdate?: (values: FormSubmitValues) => void;
  selectedAddress?: AddressInfo;
  onAddressSelected: (address: AddressInfo) => void;
  containerClassName?: string;
  customFooter?: (props: { isProcessingProfileImage: boolean }) => ReactNode;
  forceFormValues?: Partial<FormSubmitValues>;
  focusField?: keyof FormSubmitValues;
  formDisabled?: boolean;
  openAddressSelectorOnMount?: boolean;
  // image control specific props
  imageControlProps?: {
    canSwitchBetweenProcessedImages?: UploadControlProps['canSwitchBetweenProcessedImages'];
    processedImages?: UploadControlProps['processedImages'];
    onProcessedImagesListChange?: UploadControlProps['onProcessedImagesListChange'];
  };
};
