import { SelectedCommunity } from 'views/components/component_kit/new_designs/CWCommunitySelector';

export type SocialLinkField = {
  value?: string;
  error?: string;
};

export type FormSubmitValues = {
  communityName: string;
  communityDescription: string;
  chain: {
    label: string;
    value: string;
  };
  links?: string[];
};

export type BasicInformationFormProps = {
  selectedCommunity: SelectedCommunity;
  onSubmit: (values: FormSubmitValues) => any;
  onCancel: () => any;
};
