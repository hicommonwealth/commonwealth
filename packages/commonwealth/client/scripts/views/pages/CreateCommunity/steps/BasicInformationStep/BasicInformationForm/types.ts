import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';
import AddressInfo from '../../../../../../models/AddressInfo';

export type SocialLinkField = {
  value?: string;
  error?: string;
};

export type FormSubmitValues = {
  communityName: string;
  communityDescription: string;
  communityProfileImageURL: string;
  chain: {
    label: string;
    value: string;
  };
  links?: string[];
};

export type BasicInformationFormProps = {
  selectedAddress: AddressInfo;
  selectedCommunity: SelectedCommunity;
  onSubmit: (communityId: string, communityName: string) => any;
  onCancel: () => any;
  handleSelectedChainId: (chainId: string) => void;
};
