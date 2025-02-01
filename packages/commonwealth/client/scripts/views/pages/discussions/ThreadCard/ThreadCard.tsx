import { useShowImage } from 'client/scripts/hooks/useShowImage';
import clsx from 'clsx';
import { isDefaultStage, threadStageToLabel } from 'helpers';
import {
  GetThreadActionTooltipTextResponse,
  filterLinks,
} from 'helpers/threads';
import { LinkSource } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useUserStore from 'state/ui/user';
import {
  default as MarkdownViewerUsingQuillOrNewEditor,
  default as MarkdownViewerWithFallback,
} from 'views/components/MarkdownViewerWithFallback';
import { ThreadContestTagContainer } from 'views/components/ThreadContestTag';
import { ViewThreadUpvotesDrawer } from 'views/components/UpvoteDrawer';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import useBrowserWindow from '../../../../hooks/useBrowserWindow';
import { ThreadStage } from '../../../../models/types';
import app from '../../../../state/index';
import Permissions from '../../../../utils/Permissions';
import { CommentCard } from '../CommentCard';
import { isHot, removeImageFormMarkDown } from '../helpers';
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
  editingDisabled?: boolean;
  expandCommentBtnVisible?: boolean;
  onImageClick?: () => void;
  showCommentState?: boolean;
  removeImagesFromMarkDown?: boolean;
  hideThreadOptions?: boolean;
  threadImage?: string | null;
  isCardView?: boolean;
  hidePublishDate?: boolean;
  hideTrendingTag?: boolean;
  hideSpamTag?: boolean;
  maxChars?: number;
  cutoffLines?: number;
  showOnlyThreadActionIcons?: boolean;
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
  editingDisabled,
  expandCommentBtnVisible,
  showCommentState = false,
  onImageClick,
  removeImagesFromMarkDown = false,
  hideThreadOptions = false,
  threadImage,
  isCardView = false,
  hidePublishDate = false,
  hideTrendingTag = false,
  hideSpamTag = false,
  maxChars,
  cutoffLines,
  showOnlyThreadActionIcons = false,
}: CardProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);
  const [showCommentVisible, setShowCommentVisible] =
    useState<boolean>(showCommentState);
  const toggleShowComments = () => setShowCommentVisible((prev) => !prev);
  const showImage = useShowImage();

  useEffect(() => {
    if (localStorage.getItem('dark-mode-state') === 'on') {
      document.getElementsByTagName('html')[0].classList.add('invert');
    }
  }, []);

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: thread.communityId,
      enabled: !!thread.communityId && !showSkeleton,
    });

  if (showSkeleton || isLoadingCommunity || !community) {
    return (
      <CardSkeleton disabled={true} thread isWindowSmallInclusive={false} />
    );
  }

  const hasAdminPermissions =
    Permissions.isSiteAdmin() ||
    Permissions.isCommunityAdmin(community) ||
    Permissions.isCommunityModerator(community);
  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);

  const isStageDefault = isDefaultStage(app, thread.stage, customStages);
  const isTagsRowVisible =
    (thread.stage && !isStageDefault) || linkedProposals?.length > 0;
  const stageLabel = threadStageToLabel(thread.stage);

  return (
    <>
      <Link
        // @ts-expect-error <StrictNullChecks/>
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
            undoUpvoteDisabled={editingDisabled}
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
                lastUpdated: (
                  thread?.lastEdited ||
                  thread.createdAt ||
                  thread.updatedAt
                ).toISOString(),
              })}
              discord_meta={thread.discord_meta!}
              // @ts-expect-error <StrictNullChecks/>
              archivedAt={thread.archivedAt}
              profile={thread?.profile}
              layoutType={layoutType}
              hidePublishDate={hidePublishDate}
              hideSpamTag={hideSpamTag}
              hideTrendingTag={hideTrendingTag}
            />
            <div className="content-header-icons">
              {thread.pinned && <CWIcon iconName="pin" />}
            </div>
          </div>
          <div className="content-body-wrapper">
            {thread.markedAsSpamAt && <CWTag label="SPAM" type="disabled" />}
            <div className="content-title">
              <CWText type="h5" fontWeight="semiBold">
                <ThreadContestTagContainer
                  associatedContests={thread.associatedContests}
                />
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
            <CWText
              type="b1"
              className={clsx('content-body', {
                'show-image': showImage || threadImage,
              })}
            >
              {!isCardView ? (
                <MarkdownViewerUsingQuillOrNewEditor
                  markdown={
                    !removeImagesFromMarkDown
                      ? thread.body
                      : removeImageFormMarkDown(thread.body)
                  }
                  maxChars={maxChars}
                  cutoffLines={cutoffLines}
                  customShowMoreButton={
                    <CWText type="b1" className="show-more-btn">
                      Show more
                    </CWText>
                  }
                  onImageClick={onImageClick}
                />
              ) : (
                <MarkdownViewerWithFallback
                  markdown={thread.body}
                  maxChars={maxChars}
                  cutoffLines={cutoffLines}
                />
              )}
              {threadImage && (
                <div className="card-image-container">
                  <img src={threadImage} alt="Thread content" />
                </div>
              )}
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
                    // @ts-expect-error <StrictNullChecks/>
                    e.preventDefault();
                    // @ts-expect-error <StrictNullChecks/>
                    e.stopPropagation();
                    // @ts-expect-error <StrictNullChecks/>
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
          {!hideThreadOptions && (
            <div
              className="content-footer"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {!isCardView && (
                <ThreadOptions
                  totalComments={thread.numberOfComments}
                  shareEndpoint={`${window.location.origin}${threadHref}`}
                  thread={thread}
                  upvoteBtnVisible={
                    !hideReactionButton && isWindowSmallInclusive
                  }
                  commentBtnVisible={!thread.readOnly}
                  canUpdateThread={
                    canUpdateThread &&
                    user.isLoggedIn &&
                    (isThreadAuthor ||
                      isThreadCollaborator ||
                      hasAdminPermissions)
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
                  editingDisabled={editingDisabled}
                  expandCommentBtnVisible={expandCommentBtnVisible}
                  showCommentVisible={showCommentVisible}
                  toggleShowComments={toggleShowComments}
                  showOnlyThreadActionIcons={showOnlyThreadActionIcons}
                />
              )}
            </div>
          )}
        </div>
      </Link>
      {!hideRecentComments &&
      maxRecentCommentsToDisplay &&
      showCommentVisible &&
      // @ts-expect-error <StrictNullChecks/>
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
                  comment={{
                    address: recentComment.author,
                    body: recentComment.text,
                    comment_level: 0,
                    community_id: thread.communityId,
                    id: recentComment.id,
                    reply_count: 0,
                    reaction_count: parseInt(recentComment.reactionWeightsSum),
                    thread_id: thread.id,
                    user_id: recentComment?.profile?.userId ?? 0,
                    content_url: recentComment.contentUrl,
                    created_at: recentComment.createdAt.toISOString(),
                    discord_meta: recentComment.discord_meta,
                    marked_as_spam_at:
                      recentComment?.markedAsSpamAt?.toISOString(),
                    profile_name: recentComment?.profile?.name,
                    profile_avatar: recentComment?.profile?.avatarUrl,
                    reactions: recentComment.reactions.map((x) => ({
                      address_id: 0, // not needed here
                      id: x.id,
                      reaction: 'like',
                    })),
                    address_id: recentComment?.Address?.addressId || 0,
                  }}
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
