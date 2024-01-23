export type StakeData = {
  symbol: string;
  namespace: string;
};

export interface EnableStakeProps {
  goToSuccessStep: () => void;
  onOptInEnablingStake: ({ namespace, symbol }: StakeData) => void;
  communityStakeData: StakeData;
}
