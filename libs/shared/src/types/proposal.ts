export enum ProposalType {
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
}

export const enum SnapshotEventType {
  Created = 'proposal/created',
  Deleted = 'proposal/deleted',
  Ended = 'proposal/end',
  Started = 'proposal/start',
}
