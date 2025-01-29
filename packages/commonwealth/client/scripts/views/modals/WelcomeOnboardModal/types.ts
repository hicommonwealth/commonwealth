export type WelcomeOnboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export enum WelcomeOnboardModalSteps {
  Notifications = 'Notifications',
  PersonalInformation = 'PersonalInformation',
  TermsOfServices = 'TermsOfServices',
  Preferences = 'Preferences',
  JoinCommunity = 'JoinCommunity',
  MagicWallet = 'MagicWallet',
  InviteModal = 'InviteModal',
  OptionalWalletModal = 'OptionalWalletModal',
}
