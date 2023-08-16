import { capitalize } from 'lodash';
import moment from 'moment';
import React from 'react';
import AddressInfo from '../../../models/AddressInfo';
import app from '../../../state/index';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { User } from '../../components/user/user';
import { SnapshotThreadLink } from './proposal_header_links';

export const ProposalInformationCard = ({ proposal, threads }) => {
  const votingSystem = capitalize(
    proposal.type.split('-').join(' ').concat(' voting')
  );

  return (
    <CWContentPageCard
      header={'Proposal Information'}
      content={
        <div className="SnapshotInformationCard">
          <div className="info-rows-container">
            <SnapshotInfoRow
              label="Author"
              value={
                app.chain ? (
                  <User
                    user={
                      new AddressInfo(
                        null,
                        proposal.author,
                        app.activeChainId(),
                        null
                      )
                    }
                    hideAvatar
                    linkify
                    popover
                  />
                ) : (
                  proposal.author
                )
              }
            />
            <SnapshotInfoLinkRow
              label="IPFS"
              value={`#${proposal.ipfs}`}
              url={`https://ipfs.fleek.co/ipfs/${proposal.ipfs}`}
            />
            <SnapshotInfoRow label="Voting System" value={votingSystem} />
            <SnapshotInfoRow
              label="Start Date"
              value={moment(+proposal.start * 1000).format('lll')}
            />
            <SnapshotInfoRow
              label="End Date"
              value={moment(+proposal.end * 1000).format('lll')}
            />
            <SnapshotInfoLinkRow
              label={proposal.strategies.length > 1 ? 'Strategies' : 'Strategy'}
              value={
                proposal.strategies.length > 1
                  ? `${proposal.strategies.length} Strategies`
                  : proposal.strategies[0].name
              }
              url={`https://snapshot.org/#/${app.snapshot.space.id}/proposal/${proposal.id}`}
            />
            <SnapshotInfoLinkRow
              label="Snapshot"
              value={`#${proposal.snapshot}`}
              url={`https://etherscan.io/block/${proposal.snapshot}`}
            />
          </div>
          {threads.length > 0 && (
            <>
              <div className="linked-discussions">
                <CWText type="h5" fontWeight="semiBold">
                  Linked Discussions
                </CWText>
                {threads.map((thread) => (
                  <SnapshotThreadLink thread={thread} key={thread.id} />
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
