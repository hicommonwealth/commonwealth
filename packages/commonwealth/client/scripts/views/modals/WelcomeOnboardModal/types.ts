export type WelcomeOnboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export enum WelcomeOnboardModalSteps {
  PersonalInformation = 'PersonalInformation',
  TermsOfServices = 'TermsOfServices',
  Preferences = 'Preferences',
  JoinCommunity = 'JoinCommunity',
  MagicWallet = 'MagicWallet',
}
