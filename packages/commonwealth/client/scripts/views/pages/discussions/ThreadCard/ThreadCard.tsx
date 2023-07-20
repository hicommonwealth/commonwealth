import { IChainEntityKind } from 'chain-events/src';
import { isDefaultStage, threadStageToLabel } from 'helpers';
import { filterLinks } from 'helpers/threads';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import {
  chainEntityTypeToProposalShortName,
  getProposalUrlPath,
} from 'identifiers';
import { LinkSource } from 'models/Thread';
import moment from 'moment';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { slugify } from 'utils';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import useBrowserWindow from '../../../../hooks/useBrowserWindow';
import AddressInfo from '../../../../models/AddressInfo';
import { ThreadStage } from '../../../../models/types';
import Permissions from '../../../../utils/Permissions';
import { CWTag } from 'views/components/component_kit/cw_tag';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { isNewThread } from '../NewThreadTag';
import { isHot } from '../helpers';
import { AuthorAndPublishInfo } from './AuthorAndPublishInfo';
import { ThreadOptions } from './ThreadOptions';
import { AdminActionsProps } from './ThreadOptions/AdminActions';
import { ReactionButton } from './ThreadOptions/ReactionButton';
import './ThreadCard.scss';
import useUserActiveAccount from 'hooks/useUserActiveAccount';

type CardProps = AdminActionsProps & {
  onBodyClick?: () => any;
  onStageTagClick?: (stage: ThreadStage) => any;
  threadHref: string;
};

export const ThreadCard = ({
  thread,
  onDelete,
  onSpamToggle,
  onLockToggle,
  onPinToggle,
  onTopicChange,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onCollaboratorsEdit,
  onEditStart,
  onEditCancel,
  onEditConfirm,
  hasPendingEdits,
  onBodyClick,
  onStageTagClick,
  threadHref,
}: CardProps) => {
  const { isLoggedIn } = useUserLoggedIn();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }
  }, []);

  const hasAdminPermissions =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();
  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`
  );

  const isStageDefault = isDefaultStage(thread.stage);
  const isTagsRowVisible =
    (thread.stage && !isStageDefault) || linkedProposals.length > 0;

  return (
    <>
      <Link
        to={threadHref}
        className={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadCard'
        )}
        onClick={() => onBodyClick && onBodyClick()}
        key={thread.id}
      >
        {!isWindowSmallInclusive && (
          <ReactionButton
            thread={thread}
            size="big"
            disabled={!hasJoinedCommunity}
          />
        )}
        <div className="content-wrapper">
          <div className="content-header">
            <AuthorAndPublishInfo
              showSplitDotIndicator={!isWindowSmallInclusive}
              authorInfo={
                new AddressInfo(null, thread.author, thread.authorChain, null)
              }
              publishDate={moment(thread.createdAt).format('l')}
              isNew={isNewThread(thread.createdAt)}
              isLocked={thread.readOnly}
              {...(thread.lockedAt && {
                lockedAt: thread.lockedAt.toISOString(),
              })}
              {...(thread.updatedAt && {
                lastUpdated: thread.updatedAt.toISOString(),
              })}
            />
            <div className="content-header-icons">
              {isHot(thread) && <div className="flame" />}
              {thread.pinned && <CWIcon iconName="pin" />}
            </div>
          </div>
          {isTagsRowVisible && (
            <div className="content-tags">
              {thread.stage && !isStageDefault && (
                <CWTag
                  label={threadStageToLabel(thread.stage)}
                  trimAt={20}
                  type="stage"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await onStageTagClick(thread.stage);
                  }}
                />
              )}
              {linkedProposals
                .sort((a, b) => +a.identifier - +b.identifier)
                .map((link) => (
                  <CWTag
                    key={`${link.source}-${link.identifier}`}
                    type="proposal"
                    label={`${chainEntityTypeToProposalShortName(
                      'proposal' as IChainEntityKind
                    )} 
                        ${
                          Number.isNaN(parseInt(link.identifier, 10))
                            ? ''
                            : ` #${link.identifier}`
                        }`}
                  />
                ))}
            </div>
          )}
          <div className="content-body-wrapper">
            {thread.markedAsSpamAt && <CWTag label="SPAM" type="disabled" />}
            <div className="content-title">
              <CWText type="h5" fontWeight="semiBold">
                {thread.title}
              </CWText>
              {thread.hasPoll && <CWTag label="Poll" type="poll" />}

              {linkedSnapshots.length > 0 && (
                <CWTag
                  type="active"
                  label={`Snap ${(linkedSnapshots[0].identifier.includes('/')
                    ? linkedSnapshots[0].identifier.split('/')[1]
                    : linkedSnapshots[0].identifier
                  )
                    .toString()
                    .slice(0, 4)}…`}
                />
              )}
            </div>
            <CWText type="caption" className="content-body">
              {thread.plaintext}
            </CWText>
          </div>
          <div className="content-footer">
            <ThreadOptions
              totalComments={thread.numberOfComments}
              shareEndpoint={discussionLink}
              thread={thread}
              upvoteBtnVisible={isWindowSmallInclusive}
              commentBtnVisible={!thread.readOnly}
              canUpdateThread={
                isLoggedIn &&
                (isThreadAuthor || isThreadCollaborator || hasAdminPermissions)
              }
              onDelete={onDelete}
              onSpamToggle={onSpamToggle}
              onLockToggle={onLockToggle}
              onPinToggle={onPinToggle}
              onTopicChange={onTopicChange}
              onProposalStageChange={onProposalStageChange}
              onSnapshotProposalFromThread={onSnapshotProposalFromThread}
              onCollaboratorsEdit={onCollaboratorsEdit}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditConfirm={onEditConfirm}
              hasPendingEdits={hasPendingEdits}
            />
          </div>
        </div>
      </Link>
    </>
  );
};
