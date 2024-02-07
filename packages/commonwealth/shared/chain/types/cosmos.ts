import type { Coin } from '@cosmjs/stargate';
import { GovV1Client } from '@hicommonwealth/chains';
import type { TallyResult } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

// currently just used for gov v1, but this can be expanded
export type LCD = {
  cosmos: {
    gov: {
      v1: GovV1Client;
    };
  };
};

// eslint-disable-next-line no-shadow
export enum EventKind {
  SubmitProposal = 'msg-submit-proposal',
  Deposit = 'msg-deposit',
  Vote = 'msg-vote',
}

interface IEvent {
  kind: EventKind;
}

type UnixDate = number;
type Coins = { [denom: string]: string };
export function coinToCoins(cs: Coin[]): Coins {
  const res: Coins = {};
  for (const c of cs) {
    res[c.denom] = c.amount;
  }
  return res;
}

export interface ISubmitProposal extends IEvent {
  kind: EventKind.SubmitProposal;
  id: string;
  proposer?: string;
  content?: { typeUrl: string; value: string }; // hex-encoded protobuf Any value
  submitTime?: UnixDate;
  depositEndTime?: UnixDate;
  votingStartTime?: UnixDate;
  votingEndTime?: UnixDate;
  totalDeposit?: Coins;
  finalTallyResult?: TallyResult;
}

export interface IDeposit extends IEvent {
  kind: EventKind.Deposit;
  id: string;
  depositor: string;
  amount: Coins;
}

export interface IVote extends IEvent {
  kind: EventKind.Vote;
  id: string;
  voter: string;
  option: number;
}

export type IEventData = ISubmitProposal | IDeposit | IVote;
