import 'components/proposals/voting_result_components.scss';
import React from 'react';
import { CompoundProposalVote } from '../../../../controllers/chain/ethereum/compound/proposal';

import type { IVote } from '../../../../models/interfaces';
import type { AnyProposal } from '../../../../models/types';

export type BaseVotingResultProps = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

export type BaseCompoundVotingResultProps = {
  proposal: AnyProposal;
  votes: CompoundProposalVote[];
};

export type BaseVotingResultCardProps = BaseVotingResultProps & {
  isInCard: boolean;
};
