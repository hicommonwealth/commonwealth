export type StakeData = {
  symbol: string;
  namespace: string;
};

export interface EnableStakeProps {
  onOptOutEnablingStake: () => void;
  onOptInEnablingStake: ({ namespace, symbol }: StakeData) => void;
  communityStakeData: StakeData;
}
