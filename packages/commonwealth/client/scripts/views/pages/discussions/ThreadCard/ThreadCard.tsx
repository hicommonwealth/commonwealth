import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { ViewThreadUpvotesDrawer } from 'client/scripts/views/components/UpvoteDrawer';
import { CWDivider } from 'client/scripts/views/components/component_kit/cw_divider';
import { QuillRenderer } from 'client/scripts/views/components/react_quill_editor/quill_renderer';
import clsx from 'clsx';
import { isDefaultStage, threadStageToLabel } from 'helpers';
import {
  GetThreadActionTooltipTextResponse,
  filterLinks,
} from 'helpers/threads';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { LinkSource } from 'models/Thread';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThreadContestTag from 'views/components/ThreadContestTag';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import useBrowserWindow from '../../../../hooks/useBrowserWindow';
import { ThreadStage } from '../../../../models/types';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { isHot } from '../helpers';
import { AuthorAndPublishInfo } from './AuthorAndPublishInfo';
import './ThreadCard.scss';
import { CardSkeleton } from './ThreadCardSkeleton';
import { ThreadOptions } from './ThreadOptions';
import { AdminActionsProps } from './ThreadOptions/AdminActions';
import { ReactionButton } from './ThreadOptions/ReactionButton';

type CardProps = AdminActionsProps & {
  onBodyClick?: () => any;
  onStageTagClick?: (stage: ThreadStage) => any;
  threadHref?: string;
  showSkeleton?: boolean;
  canReact?: boolean;
  canComment?: boolean;
  canUpdateThread?: boolean;
  disabledActionsTooltipText?: GetThreadActionTooltipTextResponse;
  onCommentBtnClick?: () => any;
  hideRecentComments?: boolean;
  hideReactionButton?: boolean;
  hideUpvotesDrawer?: boolean;
  maxRecentCommentsToDisplay?: number;
  layoutType?: 'author-first' | 'community-first';
  customStages?: string[];
};

export const ThreadCard = ({
  thread,
  onDelete,
  onSpamToggle,
  onLockToggle,
  onPinToggle,
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
  showSkeleton,
  canReact = true,
  canComment = true,
  canUpdateThread = true,
  disabledActionsTooltipText = '',
  onCommentBtnClick = () => null,
  hideRecentComments = false,
  hideReactionButton = false,
  hideUpvotesDrawer = false,
  maxRecentCommentsToDisplay = 2,
  layoutType = 'author-first',
  customStages,
}: CardProps) => {
  const navigate = useCommonNavigate();
  const { isLoggedIn } = useUserLoggedIn();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }
  }, []);

  if (showSkeleton)
    return (
      <CardSkeleton disabled={true} thread isWindowSmallInclusive={false} />
    );

  const hasAdminPermissions =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin(null, thread.communityId) ||
    Permissions.isCommunityModerator(null, thread.communityId);
  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);

  const isStageDefault = isDefaultStage(thread.stage, customStages);
  const isTagsRowVisible =
    (thread.stage && !isStageDefault) || linkedProposals?.length > 0;
  const stageLabel = threadStageToLabel(thread.stage);

  const contestWinners = [
    { date: '03/09/2024', round: 7, isRecurring: true },
    { date: '03/10/2024', isRecurring: false },
    {
      date: '03/10/2024',
      round: 8,
      isRecurring: true,
    },
  ];
  const showContestWinnerTag = false;
  // const showContestWinnerTag = contestsEnabled && contestWinners.length > 0;

  return (
    <>
      <Link
        to={threadHref}
        className={getClasses<{ isPinned?: boolean }>(
          { isPinned: thread.pinned },
          'ThreadCard',
        )}
        onClick={() => onBodyClick && onBodyClick()}
        key={thread.id}
      >
        {!hideReactionButton && !isWindowSmallInclusive && (
          <ReactionButton
            thread={thread}
            size="big"
            disabled={!canReact}
            tooltipText={
              typeof disabledActionsTooltipText === 'function'
                ? disabledActionsTooltipText?.('upvote')
                : disabledActionsTooltipText
            }
          />
        )}
        <div className="content-wrapper">
          <div className="content-header">
            <AuthorAndPublishInfo
              authorAddress={thread.author}
              authorCommunityId={thread.authorCommunity}
              publishDate={thread.createdAt}
              isHot={isHot(thread)}
              isLocked={thread.readOnly}
              {...(thread.lockedAt && {
                lockedAt: thread.lockedAt.toISOString(),
              })}
              {...(thread.updatedAt && {
                lastUpdated: thread.updatedAt.toISOString(),
              })}
              discord_meta={thread.discord_meta}
              archivedAt={thread.archivedAt}
              profile={thread?.profile}
              layoutType={layoutType}
            />
            <div className="content-header-icons">
              {thread.pinned && <CWIcon iconName="pin" />}
            </div>
          </div>
          <div className="content-body-wrapper">
            {thread.markedAsSpamAt && <CWTag label="SPAM" type="disabled" />}
            <div className="content-title">
              <CWText type="h5" fontWeight="semiBold">
                {showContestWinnerTag &&
                  contestWinners?.map((winner, index) => (
                    <ThreadContestTag key={index} {...winner} />
                  ))}
                {thread.title}
              </CWText>
            </div>
            <div className="content-top-tags">
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
            <CWText type="b1" className="content-body">
              <QuillRenderer
                doc={thread.plaintext}
                cutoffLines={4}
                customShowMoreButton={
                  <CWText type="b1" className="show-more-btn">
                    Show more
                  </CWText>
                }
              />
            </CWText>
          </div>
          {isTagsRowVisible && (
            <div className="content-tags">
              {thread.stage && !isStageDefault && (
                <CWTag
                  label={stageLabel}
                  classNames={stageLabel}
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
                    label={`Prop 
                        ${
                          Number.isNaN(parseInt(link.identifier, 10))
                            ? ''
                            : ` #${link.identifier}`
                        }`}
                  />
                ))}
            </div>
          )}
          <div
            className="content-footer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ThreadOptions
              totalComments={thread.numberOfComments}
              shareEndpoint={`${window.location.origin}${threadHref}`}
              thread={thread}
              upvoteBtnVisible={!hideReactionButton && isWindowSmallInclusive}
              commentBtnVisible={!thread.readOnly}
              canUpdateThread={
                canUpdateThread &&
                isLoggedIn &&
                (isThreadAuthor || isThreadCollaborator || hasAdminPermissions)
              }
              canReact={canReact}
              canComment={canComment}
              onDelete={onDelete}
              onSpamToggle={onSpamToggle}
              onLockToggle={onLockToggle}
              onPinToggle={onPinToggle}
              onProposalStageChange={onProposalStageChange}
              onSnapshotProposalFromThread={onSnapshotProposalFromThread}
              onCollaboratorsEdit={onCollaboratorsEdit}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditConfirm={onEditConfirm}
              hasPendingEdits={hasPendingEdits}
              onCommentBtnClick={onCommentBtnClick}
              disabledActionsTooltipText={disabledActionsTooltipText}
              setIsUpvoteDrawerOpen={setIsUpvoteDrawerOpen}
              hideUpvoteDrawerButton={hideUpvotesDrawer}
            />
          </div>
        </div>
      </Link>
      {!hideRecentComments &&
      maxRecentCommentsToDisplay &&
      thread?.recentComments?.length > 0 ? (
        <div className={clsx('RecentComments', { hideReactionButton })}>
          {[...(thread?.recentComments || [])]
            ?.filter((recentComment) => !recentComment.deleted)
            ?.slice?.(0, maxRecentCommentsToDisplay)
            ?.sort((a, b) => b.createdAt.unix() - a.createdAt.unix())
            ?.map((recentComment) => (
              <Link
                to={`${threadHref}?comment=${recentComment.id}`}
                key={recentComment.id}
                className="Comment"
                onClick={() => onBodyClick && onBodyClick()}
              >
                <CommentCard
                  disabledActionsTooltipText={disabledActionsTooltipText}
                  canReply={!disabledActionsTooltipText}
                  replyBtnVisible
                  hideReactButton
                  comment={recentComment}
                  isThreadArchived={!!thread.archivedAt}
                  isSpam={!!recentComment.markedAsSpamAt}
                  maxReplyLimitReached={false}
                  viewUpvotesButtonVisible={false}
                  shareURL={`${window.location.origin}${threadHref}?comment=${recentComment.id}`}
                  onReply={() =>
                    navigate(
                      `${threadHref}?comment=${recentComment.id}`,
                      {},
                      null,
                    )
                  }
                />
              </Link>
            ))}
        </div>
      ) : (
        <></>
      )}
      {!hideUpvotesDrawer && (
        <ViewThreadUpvotesDrawer
          thread={thread}
          isOpen={isUpvoteDrawerOpen}
          setIsOpen={setIsUpvoteDrawerOpen}
        />
      )}
      <CWDivider className="ThreadDivider" />
    </>
  );
};
