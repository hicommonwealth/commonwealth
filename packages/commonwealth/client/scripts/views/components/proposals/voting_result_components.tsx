import React from 'react';

import type {
  CosmosProposal,
  CosmosVote,
} from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import './voting_result_components.scss';

import { CosmosProposalV1AtomOne } from 'client/scripts/controllers/chain/cosmos/gov/atomone/proposal-v1';
import type { IVote } from '../../../models/interfaces';
import type { AnyProposal } from '../../../models/types';
import { CWText } from '../component_kit/cw_text';
import { VoteListing } from './vote_listing';

type BaseVotingResultProps = {
  proposal: AnyProposal;
  votes: Array<IVote<any>>;
};

type VotingResultProps = {
  abstainVotes?: Array<IVote<any>>;
  noVotes: Array<IVote<any>>;
  yesVotes: Array<IVote<any>>;
  proposal: AnyProposal;
};

export const VotingResult = (props: VotingResultProps) => {
  const { abstainVotes, noVotes, yesVotes, proposal } = props;

  return (
    <div className="VotingResult">
      <div className="results-column-yes">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Yes (${yesVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={yesVotes} />
      </div>
      <div className="results-column-no">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`No (${noVotes.length})`}
        </CWText>
        <VoteListing proposal={proposal} votes={noVotes} />
      </div>
      {abstainVotes && (
        <div className="results-column-no">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Abstain (${abstainVotes.length})`}
          </CWText>
          <VoteListing proposal={proposal} votes={abstainVotes} />
        </div>
      )}
    </div>
  );
};

type CompletedProposalVotingResultProps = {
  abstainPct: string;
  abstainResults: string;
  noPct: string;
  noResults: string;
  noWithVetoPct: string;
  noWithVetoResults: string;
  yesPct: string;
  yesResults: string;
};

// eslint-disable-next-line react/no-multi-comp
export const CompletedProposalVotingResult = (
  props: CompletedProposalVotingResultProps,
) => {
  const {
    abstainPct,
    abstainResults,
    noPct,
    noResults,
    noWithVetoPct,
    noWithVetoResults,
    yesPct,
    yesResults,
  } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${yesPct}% voted Yes`}
        </CWText>
        <CWText>{`(${yesResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noPct}% voted No`}
        </CWText>
        <CWText>{`(${noResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${abstainPct}% voted Abstain`}
        </CWText>
        <CWText>{`(${abstainResults})`}</CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`${noWithVetoPct}% voted Veto`}
        </CWText>
        <CWText>{`(${noWithVetoResults})`}</CWText>
      </div>
    </div>
  );
};

type SimpleYesApprovalVotingResultProps = {
  approvedCount: number;
} & BaseVotingResultProps;

// eslint-disable-next-line react/no-multi-comp
export const SimpleYesApprovalVotingResult = (
  props: SimpleYesApprovalVotingResultProps,
) => {
  const { approvedCount, proposal, votes } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Approved ${approvedCount}`}
        </CWText>
        <VoteListing proposal={proposal} votes={votes} />
      </div>
    </div>
  );
};

type YesNoAbstainVetoVotingResultProps = {
  proposal: CosmosProposal;
  votes: Array<CosmosVote>;
};

// eslint-disable-next-line react/no-multi-comp
export const YesNoAbstainVetoVotingResult = (
  props: YesNoAbstainVetoVotingResultProps,
) => {
  const { proposal, votes } = props;

  return (
    <div className="VotingResult">
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted yes (${votes.filter((v) => v.choice === 'Yes').length})`}
        </CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted no (${votes.filter((v) => v.choice === 'No').length})`}
        </CWText>
      </div>
      <div className="results-column">
        <CWText type="h4" fontWeight="medium" className="results-header">
          {`Voted abstain (${
            votes.filter((v) => v.choice === 'Abstain').length
          })`}
        </CWText>
      </div>

      {!(proposal instanceof CosmosProposalV1AtomOne) && (
        <div className="results-column">
          <CWText type="h4" fontWeight="medium" className="results-header">
            {`Voted veto (${
              votes.filter((v) => v.choice === 'NoWithVeto').length
            })`}
          </CWText>
        </div>
      )}
    </div>
  );
};
