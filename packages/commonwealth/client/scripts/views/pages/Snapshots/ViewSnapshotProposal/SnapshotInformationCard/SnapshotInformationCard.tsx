import _ from 'lodash';
import moment from 'moment/moment';
import React from 'react';

import { SnapshotProposal } from 'helpers/snapshot_utils';
import app from 'state';
import { CWContentPageCard } from 'views/components/component_kit/CWContentPageCard';
import { CWText } from 'views/components/component_kit/cw_text';
import { User } from 'views/components/user/user';
import { SnapshotThreadLink } from 'views/pages/view_proposal/proposal_header_links';

import { SnapshotInfoLinkRow, SnapshotInfoRow } from './SnapshotInfoRow';

import './SnapshotInformationCard.scss';

type SnapshotInformationCardProps = {
  proposal: SnapshotProposal;
  threads: Array<{ id: number; title: string }> | null;
  spaceId: string;
};

export const SnapshotInformationCard = ({
  proposal,
  threads,
  spaceId,
}: SnapshotInformationCardProps) => {
  const votingSystem = _.capitalize(
    proposal.type.split('-').join(' ').concat(' voting'),
  );

  return (
    <CWContentPageCard
      header="Information"
      content={
        <div className="SnapshotInformationCard">
          <div className="info-rows-container">
            <SnapshotInfoRow
              label="Author"
              value={
                app.chain ? (
                  <User
                    userAddress={proposal?.author}
                    userCommunityId={app.activeChainId() || ''}
                    shouldHideAvatar
                    shouldLinkProfile
                    shouldShowPopover
                  />
                ) : (
                  proposal?.author || 'Deleted'
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
              // @ts-expect-error <StrictNullChecks/>
              label={proposal.strategies.length > 1 ? 'Strategies' : 'Strategy'}
              value={
                // @ts-expect-error <StrictNullChecks/>
                proposal.strategies.length > 1
                  ? // @ts-expect-error <StrictNullChecks/>
                    `${proposal.strategies.length} Strategies`
                  : // @ts-expect-error <StrictNullChecks/>
                    proposal.strategies[0].name
              }
              url={`https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`}
            />
            <SnapshotInfoLinkRow
              label="Snapshot"
              value={`#${proposal.snapshot}`}
              url={`https://etherscan.io/block/${proposal.snapshot}`}
            />
          </div>
          {/* @ts-expect-error StrictNullChecks*/}
          {threads.length > 0 && (
            <>
              <div className="linked-discussions">
                <CWText type="h5" fontWeight="semiBold">
                  Linked Discussions
                </CWText>
                {/* @ts-expect-error StrictNullChecks*/}
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
