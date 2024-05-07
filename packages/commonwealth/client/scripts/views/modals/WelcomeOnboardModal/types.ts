export type WelcomeOnboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export enum WelcomeOnboardModalSteps {
  PersonalInformation = 'PersonalInformation',
  Preferences = 'Preferences',
  JoinCommunity = 'JoinCommunity',
}
