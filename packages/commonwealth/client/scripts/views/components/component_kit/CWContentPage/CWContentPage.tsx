import { IThreadCollaborator } from 'client/scripts/models/Thread';
import 'components/component_kit/CWContentPage.scss';
import moment from 'moment';
import React, { ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import type Account from '../../../../models/Account';
import AddressInfo from '../../../../models/AddressInfo';
import MinimumProfile from '../../../../models/MinimumProfile';
import { Thread } from '../../../../models/Thread';
import { ThreadStage } from '../../../../models/types';
import { AuthorAndPublishInfo } from '../../../pages/discussions/ThreadCard/AuthorAndPublishInfo';
import { ThreadOptions } from '../../../pages/discussions/ThreadCard/ThreadOptions';
import { CWCard } from '../cw_card';
import { CWTab, CWTabBar } from '../cw_tabs';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { CWContentPageSkeleton } from './CWContentPageSkeleton';

export type ContentPageSidebarItem = {
  label: string;
  item: ReactNode;
};

// tuple
export type SidebarComponents = [
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem
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
}: ContentPageProps) => {
  const navigate = useNavigate();
  const [urlQueryParams] = useSearchParams();

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
        authorChainId={
          typeof author?.chain === 'string' ? author?.chain : author?.chain?.id
        }
        collaboratorsInfo={collaborators}
        publishDate={
          createdOrEditedDate ? moment(createdOrEditedDate).format('l') : null
        }
        viewsCount={viewCount}
        showPublishLabelWithDate={!lastEdited}
        showEditedLabelWithDate={!!lastEdited}
        isSpamThread={isSpamThread}
        threadStage={stageLabel}
      />
    </div>
  );

  const mainBody = (
    <div className="main-body-container">
      <div className="header">
        {typeof title === 'string' ? (
          <CWText type="h3" fontWeight="semiBold">
            {title}
          </CWText>
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
            onProposalStageChange={onProposalStageChange}
            onSnapshotProposalFromThread={onSnapshotProposalFromThread}
          />
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
          <CWTabBar>
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
          </CWTabBar>
          {tabSelected === 0 && mainBody}
          {sidebarComponents?.length >= 1 &&
            tabSelected === 1 &&
            sidebarComponents[0].item}
          {sidebarComponents?.length >= 2 &&
            tabSelected === 2 &&
            sidebarComponents[1].item}
          {sidebarComponents?.length === 3 &&
            tabSelected === 3 &&
            sidebarComponents[2].item}
        </div>
      )}
    </div>
  );
};

type ContentPageCardProps = {
  content: ReactNode;
  header: string;
};

export const CWContentPageCard = (props: ContentPageCardProps) => {
  const { content, header } = props;

  return (
    <CWCard className="ContentPageCard">
      <div className="header-container">
        <CWText type="h5" fontWeight="semiBold">
          {header}
        </CWText>
      </div>
      {content}
    </CWCard>
  );
};
