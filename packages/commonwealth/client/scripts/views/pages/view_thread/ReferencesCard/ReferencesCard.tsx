import { ProposalType, slugify } from '@hicommonwealth/shared';
import { filterLinks } from 'helpers/threads';
import { getProposalUrlPath } from 'identifiers';
import type Thread from 'models/Thread';
import { LinkSource } from 'models/Thread';
import React from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import {
  useDeleteThreadLinksMutation,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import { CWText } from '../../../components/component_kit/cw_text';
import { CWButton } from '../../../components/component_kit/new_designs/CWButton';
import { LinkedProposalsCard } from '../linked_proposals_card';
import { LinkedThreadsCard } from '../linked_threads_card';
import { LinkedUrlCard } from '../LinkedUrlCard';
import './ReferencesCard.scss';

type ReferencesCardProps = {
  thread: Thread;
  canManageReferences: boolean;
};

export const ReferencesCard = ({
  thread,
  canManageReferences,
}: ReferencesCardProps) => {
  const { mutateAsync: deleteThreadLinks } = useDeleteThreadLinksMutation();

  const hasProposalLinks =
    filterLinks(thread?.links, LinkSource.Snapshot).length > 0 ||
    filterLinks(thread?.links, LinkSource.Proposal).length > 0;
  const hasDiscussionLinks =
    filterLinks(thread?.links, LinkSource.Thread).length > 0;
  const hasWebLinks = filterLinks(thread?.links, LinkSource.Web).length > 0;

  const showProposalCard = hasProposalLinks || canManageReferences;
  const showDiscussionCard = hasDiscussionLinks || canManageReferences;
  const showWebLinksCard = hasWebLinks || canManageReferences;
  const relatedProposals = [
    ...filterLinks(thread?.links, LinkSource.Proposal),
    ...filterLinks(thread?.links, LinkSource.Snapshot),
  ];
  const relatedDiscussions = filterLinks(thread?.links, LinkSource.Thread);
  const otherReferences = filterLinks(thread?.links, LinkSource.Web);
  const communityId = app.activeChainId() || '';
  const { data: linkedThreads = [] } = useGetThreadsByIdQuery({
    community_id: communityId,
    thread_ids: relatedDiscussions.map((l) => Number(l.identifier)),
    apiCallEnabled: relatedDiscussions.length > 0 && !!communityId,
  });

  const handleRemove = (source: LinkSource, identifier: string) => {
    deleteThreadLinks({
      thread_id: thread.id,
      links: [{ source, identifier }],
    }).catch(console.error);
  };

  const renderRows = (
    links: { identifier: string; title?: string | null; source: LinkSource }[],
  ) =>
    links.map((link) => (
      <div key={`${link.source}-${link.identifier}`} className="reference-row">
        {link.source === LinkSource.Thread ? (
          <CWText type="b2">
            -{' '}
            <Link
              to={`${getProposalUrlPath(
                linkedThreads.find(
                  (t) => String(t.identifier) === String(link.identifier),
                )?.slug || ProposalType.Thread,
                `${link.identifier}-${slugify(link.title || 'discussion')}`,
                false,
              )}?tab=0`}
            >
              {link.title || link.identifier}
            </Link>
          </CWText>
        ) : link.source === LinkSource.Web ? (
          <CWText type="b2">
            -{' '}
            <Link to={String(link.identifier)} target="_blank">
              {link.title || link.identifier}
            </Link>
          </CWText>
        ) : (
          <CWText type="b2">{`- ${link.title || link.identifier}`}</CWText>
        )}
        {canManageReferences && (
          <CWButton
            buttonType="tertiary"
            buttonHeight="sm"
            label="x"
            onClick={(e) => {
              e.preventDefault();
              handleRemove(link.source, String(link.identifier));
            }}
          />
        )}
      </div>
    ));

  if (!showProposalCard && !showDiscussionCard && !showWebLinksCard) {
    return null;
  }

  return (
    <div className="ReferencesCard">
      {(relatedProposals.length > 0 ||
        relatedDiscussions.length > 0 ||
        otherReferences.length > 0) && (
        <div className="ReferencesCard-list">
          <CWText type="h4">Related Proposals</CWText>
          {relatedProposals.length > 0 ? (
            <>
              {renderRows(relatedProposals)}
              {canManageReferences && (
                <LinkedProposalsCard
                  thread={thread}
                  showAddProposalButton={true}
                  actionOnly={true}
                  actionLabel="Add more"
                />
              )}
            </>
          ) : (
            <CWText type="b2">- None</CWText>
          )}

          <CWText type="h4">Related Discussions</CWText>
          {relatedDiscussions.length > 0 ? (
            <>
              {renderRows(relatedDiscussions)}
              {canManageReferences && (
                <LinkedThreadsCard
                  thread={thread}
                  allowLinking={true}
                  actionOnly={true}
                  actionLabel="Add more"
                />
              )}
            </>
          ) : (
            <CWText type="b2">- None</CWText>
          )}

          <CWText type="h4">Other References</CWText>
          {otherReferences.length > 0 ? (
            <>
              {renderRows(otherReferences)}
              {canManageReferences && (
                <LinkedUrlCard
                  thread={thread}
                  allowLinking={true}
                  actionOnly={true}
                  actionLabel="Add more"
                />
              )}
            </>
          ) : (
            <CWText type="b2">- None</CWText>
          )}
        </div>
      )}

      <div className="cards-column">
        {showProposalCard && relatedProposals.length === 0 && (
          <LinkedProposalsCard
            thread={thread}
            showAddProposalButton={canManageReferences}
          />
        )}
        {showDiscussionCard && relatedDiscussions.length === 0 && (
          <LinkedThreadsCard
            thread={thread}
            allowLinking={canManageReferences}
          />
        )}
        {showWebLinksCard && otherReferences.length === 0 && (
          <LinkedUrlCard thread={thread} allowLinking={canManageReferences} />
        )}
      </div>
    </div>
  );
};
