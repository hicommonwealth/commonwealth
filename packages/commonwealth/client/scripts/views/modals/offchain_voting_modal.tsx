import React from 'react';

import { VoteView } from '@hicommonwealth/schemas';
import { z } from 'zod/v4';
import {
  CWModalBody,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { User } from '../components/user/user';

import './offchain_voting_modal.scss';

type OffchainVotingModalProps = {
  onModalClose: () => void;
  votes: Array<z.infer<typeof VoteView>>;
};

export const OffchainVotingModal = (props: OffchainVotingModalProps) => {
  const { onModalClose, votes } = props;

  if (!votes || votes.length === 0) return;

  const csvRows: [string, string][] = [];
  votes.forEach((vote) => csvRows.push([vote.address, vote.option]));

  // votes by weighted voting power
  const totalVoteWeight = votes.reduce(
    (sum, vote) => sum + BigInt(vote.calculated_voting_weight || 1),
    0n,
  );
  const votesPct = votes.map((vote) => ({
    ...vote,
    pct:
      Number(
        (BigInt(vote.calculated_voting_weight || 1) * 10000n) / totalVoteWeight,
      ) / 100,
  }));

  return (
    <div className="OffchainVotingModal">
      <CWModalHeader label="Votes" onModalClose={onModalClose} />
      <CWModalBody className="OffchainVotingModalBody">
        <div className="download-link">
          <a
            onClick={(e) => {
              e.preventDefault();
              const csvContent = `data:text/csv;charset=utf-8,${csvRows
                .map((r) => r.join(','))
                .join('\n')}`;
              const encodedUri = encodeURI(csvContent);
              window.open(encodedUri);
            }}
          >
            Download all votes as CSV
          </a>
        </div>
        {votesPct.map((vote) => (
          <div className="offchain-poll-voter" key={vote.id}>
            <div className="offchain-poll-voter-user">
              <User
                shouldShowPopover
                shouldLinkProfile
                userAddress={vote.address}
                userCommunityId={vote.author_community_id}
                shouldShowAsDeleted={
                  (!vote.address && !vote.author_community_id) || !vote.user_id
                }
              />
            </div>
            <div className="offchain-poll-voter-choice">{vote.option}</div>
            <div className="offchain-poll-voter-weight">
              {vote.calculated_voting_weight ? vote.pct + '%' : ''}
            </div>
          </div>
        ))}
      </CWModalBody>
    </div>
  );
};
