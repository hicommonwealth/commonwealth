import { getThreadActionTooltipText } from 'helpers/threads';
import { truncate } from 'helpers/truncate';
import { useFlag } from 'hooks/useFlag';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { IThreadCollaborator } from 'models/Thread';
import moment from 'moment';
import React, { ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import app from 'state';
import { useRefreshMembershipQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import ThreadContestTag from 'views/components/ThreadContestTag';
import { isHot } from 'views/pages/discussions/helpers';
import Account from '../../../../models/Account';
import AddressInfo from '../../../../models/AddressInfo';
import MinimumProfile from '../../../../models/MinimumProfile';
import { Thread } from '../../../../models/Thread';
import { ThreadStage } from '../../../../models/types';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { ThreadOptions } from '../../../pages/discussions/ThreadCard/ThreadOptions';
import { ViewThreadUpvotesDrawer } from '../../UpvoteDrawer';
import { CWTab, CWTabsRow } from '../new_designs/CWTabs';
import { ComponentType } from '../types';
import './CWContentPage.scss';
import { CWContentPageSkeleton } from './CWContentPageSkeleton';

export type ContentPageSidebarItem = {
  label: string;
  item: ReactNode;
};

// tuple
export type SidebarComponents = [
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem,
];

type ContentPageProps = {
  thread?: Thread;
  createdAt?: moment.Moment | number;
  title?: string | ReactNode;
  updatedAt?: moment.Moment;
  lastEdited?: moment.Moment | number;
  author?: Account | AddressInfo | MinimumProfile | undefined;
  discord_meta?: {
    user: { id: string; username: string };
    channel_id: string;
    message_id: string;
  };
  collaborators?: IThreadCollaborator[];
  body?: (children: ReactNode) => ReactNode;
  comments?: ReactNode;
  contentBodyLabel?: 'Snapshot' | 'Thread'; // proposals don't need a label because they're never tabbed
  stageLabel?: ThreadStage;
  headerComponents?: React.ReactNode;
  readOnly?: boolean;
  lockedAt?: moment.Moment;
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: ReactNode;
  subHeader?: ReactNode;
  viewCount?: number;
  isSpamThread?: boolean;
  onLockToggle?: (isLocked: boolean) => any;
  onDelete?: () => any;
  onSpamToggle?: (thread: Thread) => any;
  onPinToggle?: (isPinned: boolean) => any;
  onProposalStageChange?: (newStage: ThreadStage) => any;
  onSnapshotProposalFromThread?: () => any;
  onCollaboratorsEdit?: (collaborators: IThreadCollaborator[]) => any;
  onEditStart?: () => any;
  onEditConfirm?: () => any;
  onEditCancel?: () => any;
  hasPendingEdits?: boolean;
  canUpdateThread?: boolean;
  showTabs?: boolean;
  showSkeleton?: boolean;
  isEditing?: boolean;
  sidebarComponentsSkeletonCount?: number;
  setThreadBody?: (body: string) => void;
};

export const CWContentPage = ({
  thread,
  author,
  discord_meta,
  body,
  comments,
  contentBodyLabel,
  createdAt,
  lastEdited,
  stageLabel,
  showSidebar,
  sidebarComponents,
  subBody,
  subHeader,
  title,
  viewCount,
  isSpamThread,
  collaborators,
  onLockToggle,
  onPinToggle,
  onDelete,
  onProposalStageChange,
  onSnapshotProposalFromThread,
  onCollaboratorsEdit,
  onEditCancel,
  onEditConfirm,
  onEditStart,
  onSpamToggle,
  hasPendingEdits,
  canUpdateThread,
  showTabs = false,
  showSkeleton,
  isEditing = false,
  sidebarComponentsSkeletonCount = 2,
  setThreadBody,
}: ContentPageProps) => {
  const navigate = useNavigate();
  const [urlQueryParams] = useSearchParams();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();
  const [isUpvoteDrawerOpen, setIsUpvoteDrawerOpen] = useState<boolean>(false);
  const contestsEnabled = useFlag('contest');

  const { data: memberships = [] } = useRefreshMembershipQuery({
    communityId: app.activeChainId(),
    address: app?.user?.activeAccount?.address,
    apiEnabled: !!app?.user?.activeAccount?.address,
  });

  const isTopicGated = !!(memberships || []).find((membership) =>
    membership.topicIds.includes(thread?.topic?.id),
  );

  const isActionAllowedInGatedTopic = !!(memberships || []).find(
    (membership) =>
      membership.topicIds.includes(thread?.topic?.id) && membership.isAllowed,
  );

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isRestrictedMembership =
    !isAdmin && isTopicGated && !isActionAllowedInGatedTopic;

  const tabSelected = useMemo(() => {
    const tab = Object.fromEntries(urlQueryParams.entries())?.tab;
    if (!tab) {
      return 0;
    }
    return parseInt(tab, 10);
  }, [urlQueryParams]);

  const setTabSelected = (newTab: number) => {
    const newQueryParams = new URLSearchParams(urlQueryParams.toString());
    newQueryParams.set('tab', `${newTab}`);
    navigate({
      pathname: location.pathname,
      search: `?${newQueryParams.toString()}`,
    });
  };

  if (showSkeleton) {
    return (
      <CWContentPageSkeleton
        sidebarComponentsSkeletonCount={sidebarComponentsSkeletonCount}
      />
    );
  }

  const createdOrEditedDate = lastEdited ? lastEdited : createdAt;

  let authorCommunityId: string;
  if (author instanceof MinimumProfile) {
    authorCommunityId = author?.chain;
  } else if (author instanceof Account) {
    authorCommunityId = author.community.id;
  }

  const authorAndPublishInfoRow = (
    <div className="header-info-row">
      <AuthorAndPublishInfo
        showSplitDotIndicator={true}
        discord_meta={discord_meta}
        isLocked={thread?.readOnly}
        {...(thread?.lockedAt && {
          lockedAt: thread.lockedAt.toISOString(),
        })}
        {...(thread?.updatedAt && {
          lastUpdated: thread.updatedAt.toISOString(),
        })}
        authorAddress={author?.address}
        authorCommunityId={authorCommunityId}
        collaboratorsInfo={collaborators}
        publishDate={moment(createdOrEditedDate, 'X')}
        viewsCount={viewCount}
        showPublishLabelWithDate={!lastEdited}
        showEditedLabelWithDate={!!lastEdited}
        isSpamThread={isSpamThread}
        threadStage={stageLabel}
        archivedAt={thread?.archivedAt}
        isHot={isHot(thread)}
        profile={thread?.profile}
        versionHistory={thread?.versionHistory}
        changeContentText={setThreadBody}
      />
    </div>
  );

  const disabledActionsTooltipText = getThreadActionTooltipText({
    isCommunityMember: !!hasJoinedCommunity,
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    isThreadTopicGated: isRestrictedMembership,
  });

  const contestWinners = [
    { date: '03/09/2024', round: 7, isRecurring: true },
    { date: '03/10/2024', isRecurring: false },
    {
      date: '03/10/2024',
      round: 8,
      isRecurring: true,
    },
  ];
  const showContestWinnerTag = contestsEnabled && contestWinners.length > 0;

  const mainBody = (
    <div className="main-body-container">
      <div className="header">
        {typeof title === 'string' ? (
          <h1 className="title">
            {showContestWinnerTag &&
              contestWinners?.map((winner, index) => (
                <ThreadContestTag key={index} {...winner} />
              ))}
            {truncate(title)}
          </h1>
        ) : (
          title
        )}
        {!isEditing ? authorAndPublishInfoRow : <></>}
      </div>
      {subHeader}
      {isEditing ? authorAndPublishInfoRow : <></>}
      {body &&
        body(
          <ThreadOptions
            upvoteBtnVisible={!thread?.readOnly}
            upvoteDrawerBtnBelow={true}
            commentBtnVisible={!thread?.readOnly}
            thread={thread}
            totalComments={thread?.numberOfComments}
            onLockToggle={onLockToggle}
            onSpamToggle={onSpamToggle}
            onDelete={onDelete}
            onPinToggle={onPinToggle}
            onCollaboratorsEdit={onCollaboratorsEdit}
            onEditCancel={onEditCancel}
            onEditConfirm={onEditConfirm}
            onEditStart={onEditStart}
            canUpdateThread={canUpdateThread}
            hasPendingEdits={hasPendingEdits}
            canReact={!disabledActionsTooltipText}
            canComment={!disabledActionsTooltipText}
            onProposalStageChange={onProposalStageChange}
            disabledActionTooltipText={disabledActionsTooltipText}
            onSnapshotProposalFromThread={onSnapshotProposalFromThread}
            setIsUpvoteDrawerOpen={setIsUpvoteDrawerOpen}
          />,
        )}

      {subBody}
      {comments}
    </div>
  );

  return (
    <div className={ComponentType.ContentPage}>
      {!showTabs ? (
        <div className="sidebar-view">
          {mainBody}
          {showSidebar && (
            <div className="sidebar">
              {sidebarComponents?.map((c) => (
                <React.Fragment key={c.label}>{c.item}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="tabs-view">
          <div className="cw-tabs-row-container">
            <CWTabsRow>
              <CWTab
                label={contentBodyLabel}
                onClick={() => {
                  setTabSelected(0);
                }}
                isSelected={tabSelected === 0}
              />
              {sidebarComponents?.map((item, i) => (
                <CWTab
                  key={item.label}
                  label={item.label}
                  onClick={() => {
                    setTabSelected(i + 1);
                  }}
                  isSelected={tabSelected === i + 1}
                />
              ))}
            </CWTabsRow>
          </div>
          {tabSelected === 0 && mainBody}
          {sidebarComponents?.length >= 1 &&
            tabSelected === 1 &&
            sidebarComponents[0].item}
          {sidebarComponents?.length >= 2 &&
            tabSelected === 2 &&
            sidebarComponents[1].item}
          {sidebarComponents?.length >= 3 &&
            tabSelected === 3 &&
            sidebarComponents[2].item}
        </div>
      )}
      <ViewThreadUpvotesDrawer
        thread={thread}
        isOpen={isUpvoteDrawerOpen}
        setIsOpen={setIsUpvoteDrawerOpen}
      />
    </div>
  );
};
