import React from 'react';

import Vote from '../../models/Vote';
import {
  CWModalBody,
  CWModalHeader,
} from '../components/component_kit/new_designs/CWModal';
import { User } from '../components/user/user';

import '../../../styles/modals/offchain_voting_modal.scss';

type OffchainVotingModalProps = {
  onModalClose: () => void;
  votes: Array<Vote>;
};

export const OffchainVotingModal = (props: OffchainVotingModalProps) => {
  const { onModalClose, votes } = props;

  if (!votes || votes.length === 0) return;

  const csvRows = [];

  votes.forEach((vote) => csvRows.push([vote.address, vote.option]));

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
        {votes.map((vote) => (
          <div className="offchain-poll-voter" key={vote.id}>
            <div className="offchain-poll-voter-user">
              <User
                shouldShowPopover
                shouldLinkProfile
                userAddress={vote.address}
                userCommunityId={vote.authorCommunityId}
              />
            </div>
            <div className="offchain-poll-voter-choice">{vote.option}</div>
          </div>
        ))}
      </CWModalBody>
    </div>
  );
};
