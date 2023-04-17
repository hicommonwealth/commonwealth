import 'modals/offchain_voting_modal.scss';
import React from 'react';
import AddressInfo from '../../models/AddressInfo';
import type Vote from '../../models/Vote';
import { CWIconButton } from '../components/component_kit/cw_icon_button';

import { User } from '../components/user/user';

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
      <div className="compact-modal-title">
        <h3>Votes</h3>
        <CWIconButton iconName="close" onClick={() => onModalClose()} />
      </div>
      <div className="compact-modal-body">
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
          <div className="offchain-poll-voter">
            <div className="offchain-poll-voter-user">
              <User
                avatarSize={16}
                popover
                linkify
                user={
                  new AddressInfo(
                    null,
                    vote.address,
                    vote.authorChain,
                    null,
                    null
                  )
                }
              />
            </div>
            <div className="offchain-poll-voter-choice">{vote.option}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
