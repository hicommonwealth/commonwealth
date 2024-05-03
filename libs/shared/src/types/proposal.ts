export enum ProposalType {
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  CompoundProposal = 'compoundproposal',
  AaveProposal = 'onchainproposal',
  SputnikProposal = 'sputnikproposal',
}

export type SnapshotProposalAttributes = {
  id: string;
  title?: string;
  body?: string;
  choices?: string[];
  space: string;
  event: string;
  start?: string;
  expire: string;
  is_upstream_deleted?: boolean;
};

export const enum SnapshotEventType {
  Created = 'proposal/created',
  Deleted = 'proposal/deleted',
  Ended = 'proposal/end',
  Started = 'proposal/start',
}

export interface ISnapshotNotificationData {
  id?: string;
  title?: string;
  body?: string;
  choices?: string[];
  space?: string;
  event?: string;
  start?: string;
  expire?: string;
  eventType: SnapshotEventType;
}
