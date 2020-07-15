import { TallyType, VoteType, VoteOutcome } from '@edgeware/node-types/interfaces';
import { IIdentifiable, ICompletable } from '../../shared';

export interface IEdgewareSignalingProposal extends IIdentifiable {
  hash: string;
  voteIndex: number;
  author: string;
  title: string;
  description: string;
  tallyType: TallyType;
  voteType: VoteType;
  choices: VoteOutcome[];
}
