export enum SupportedSputnikProposalTypes {
  AddMemberToRole = 'Add Member',
  RemoveMemberFromRole = 'Remove Member',
  Transfer = 'Payout',
  Vote = 'Poll',
}

export enum SupportedCosmosProposalTypes {
  Text = 'Text Proposal',
  CommunitySpend = 'Community Spend',
}

export type AaveProposalState = {
  calldata?: string;
  signature?: string;
  target?: string;
  value?: string;
  withDelegateCall: boolean;
};

export const defaultStateItem = {
  calldata: undefined,
  signature: undefined,
  target: undefined,
  value: undefined,
  withDelegateCall: false,
};
