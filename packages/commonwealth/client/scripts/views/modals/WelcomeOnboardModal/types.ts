export type WelcomeOnboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export enum WelcomeOnboardModalSteps {
  PersonalInformation = 'PersonalInformation',
  Interests = 'Interests',
  JoinCommunity = 'JoinCommunity',
}
