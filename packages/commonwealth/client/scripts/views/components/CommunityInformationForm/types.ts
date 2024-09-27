import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';

export type SocialLinkField = {
  value?: string;
  error?: string;
};

export type CommunityInformationFormSubmitValues = {
  communityName: string;
  communityDescription: string;
  communityProfileImageURL: string;
  chain?: {
    label: string;
    value: string;
  };
  links?: string[];
};

export type CommunityInformationFormProps = {
  onSubmit: (
    values: CommunityInformationFormSubmitValues & { communityId: string },
  ) => Promise<void>;
  onCancel: () => void;
  onWatch?: (values: CommunityInformationFormSubmitValues) => void;
  withChainsConfig?: {
    community: SelectedCommunity;
  };
  withSocialLinks?: boolean;
  isCreatingCommunity: boolean;
  initialValues?: CommunityInformationFormSubmitValues;
  submitBtnLabel: string;
};
