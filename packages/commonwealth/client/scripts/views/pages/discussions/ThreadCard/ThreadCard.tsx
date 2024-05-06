import { slugify } from '@hicommonwealth/shared';
import { ViewThreadUpvotesDrawer } from 'client/scripts/views/components/UpvoteDrawer';
import { QuillRenderer } from 'client/scripts/views/components/react_quill_editor/quill_renderer';
import { isDefaultStage, threadStageToLabel } from 'helpers';
import { filterLinks } from 'helpers/threads';
import { useFlag } from 'hooks/useFlag';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { getProposalUrlPath } from 'identifiers';
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
  disabledActionsTooltipText?: string;
  onCommentBtnClick?: () => any;
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
  disabledActionsTooltipText = '',
  onCommentBtnClick = () => null,
}: CardProps) => {
  const { isLoggedIn } = useUserLoggedIn();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);
  const contestsEnabled = useFlag('contest');

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
    Permissions.isCommunityAdmin() ||
    Permissions.isCommunityModerator();
  const isThreadAuthor = Permissions.isThreadAuthor(thread);
  const isThreadCollaborator = Permissions.isThreadCollaborator(thread);

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
  );

  const isStageDefault = isDefaultStage(thread.stage);
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
        {!isWindowSmallInclusive && (
          <ReactionButton
            thread={thread}
            size="big"
            disabled={!canReact}
            tooltipText={disabledActionsTooltipText}
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
            <CWText type="caption" className="content-body">
              <QuillRenderer doc={thread.plaintext} />
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
              shareEndpoint={discussionLink}
              thread={thread}
              upvoteBtnVisible={isWindowSmallInclusive}
              commentBtnVisible={!thread.readOnly}
              canUpdateThread={
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
              disabledActionTooltipText={disabledActionsTooltipText}
              setIsUpvoteDrawerOpen={setIsUpvoteDrawerOpen}
            />
          </div>
        </div>
      </Link>
      <ViewThreadUpvotesDrawer
        thread={thread}
        isOpen={isUpvoteDrawerOpen}
        setIsOpen={setIsUpvoteDrawerOpen}
      />
    </>
  );
};
