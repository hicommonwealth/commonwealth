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
  chainEcosystem: 'cosmos' | 'ethereum' | 'polygon';
  onSubmit: (values: FormSubmitValues) => any;
};
