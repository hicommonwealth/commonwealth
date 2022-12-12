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
