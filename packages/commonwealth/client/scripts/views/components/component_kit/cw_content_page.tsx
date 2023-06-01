import { IThreadCollaborator } from 'client/scripts/models/Thread';
import 'components/component_kit/cw_content_page.scss';
import moment from 'moment';
import React, { ReactNode, useState } from 'react';
import type Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import MinimumProfile from '../../../models/MinimumProfile';
import { Thread } from '../../../models/Thread';
import Topic from '../../../models/Topic';
import { ThreadStage } from '../../../models/types';
import { ThreadAuthorAndPublishInfo } from '../../pages/discussions/ThreadCard/ThreadAuthorAndPublishInfo';
import { ThreadOptions } from '../../pages/discussions/ThreadCard/ThreadOptions';
import { CWCard } from './cw_card';
import { CWTab, CWTabBar } from './cw_tabs';
import { CWText } from './cw_text';
import { ComponentType } from './types';

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
  createdAt: moment.Moment | number;
  title: string | ReactNode;
  lastEdited?: moment.Moment | number;
  author?: Account | AddressInfo | MinimumProfile | undefined;
  collaborators?: IThreadCollaborator[];
  body?: (children: ReactNode) => ReactNode;
  comments?: ReactNode;
  contentBodyLabel?: 'Snapshot' | 'Thread'; // proposals don't need a label because they're never tabbed
  stageLabel?: ThreadStage;
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: ReactNode;
  subHeader?: ReactNode;
  viewCount?: number;
  displayNewTag?: boolean;
  isSpamThread?: boolean;
  onLockToggle?: (isLocked: boolean) => any;
  onDelete?: () => any;
  onSpamToggle?: (isSpam: boolean) => any;
  onPinToggle?: (isPinned: boolean) => any;
  onTopicChange?: (newTopic: Topic) => any;
  onProposalStageChange?: (newStage: ThreadStage) => any;
  onSnapshotProposalFromThread?: () => any;
  onCollaboratorsEdit?: (collaborators: IThreadCollaborator[]) => any;
  onEditStart?: () => any;
  onEditConfirm?: () => any;
  onEditCancel?: () => any;
  hasPendingEdits?: boolean;
  canUpdateThread?: boolean;
  showTabs?: boolean;
};

export const CWContentPage = ({
  thread,
  author,
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
  displayNewTag,
  isSpamThread,
  collaborators,
  onLockToggle,
  onPinToggle,
  onDelete,
  onTopicChange,
  onCollaboratorsEdit,
  onEditCancel,
  onEditConfirm,
  onEditStart,
  hasPendingEdits,
  canUpdateThread,
  showTabs = false,
}: ContentPageProps) => {
  const [tabSelected, setTabSelected] = useState<number>(0);
  const createdOrEditedDate = lastEdited ? lastEdited : createdAt;

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
        <div className="header-info-row">
          <ThreadAuthorAndPublishInfo
            showSplitDotIndicator={true}
            isNewThread={!!displayNewTag}
            isThreadLocked={thread.readOnly}
            authorInfo={
              new AddressInfo(
                null,
                author.address,
                typeof author.chain === 'string'
                  ? author.chain
                  : author.chain.id,
                null
              )
            }
            collaboratorsInfo={collaborators}
            threadPublishDate={
              createdOrEditedDate
                ? moment(createdOrEditedDate).format('l')
                : null
            }
            viewsCount={viewCount}
            showPublishLabelWithDate={!lastEdited}
            showEditedLabelWithDate={!!lastEdited}
            isSpamThread={isSpamThread}
            threadStage={stageLabel}
          />
        </div>
      </div>
      {subHeader}

      {body &&
        body(
          <ThreadOptions
            canVote={true}
            thread={thread}
            totalComments={thread.numberOfComments}
            onLockToggle={onLockToggle}
            onDelete={onDelete}
            onPinToggle={onPinToggle}
            onTopicChange={onTopicChange}
            onCollaboratorsEdit={onCollaboratorsEdit}
            onEditCancel={onEditCancel}
            onEditConfirm={onEditConfirm}
            onEditStart={onEditStart}
            canUpdateThread={canUpdateThread}
            hasPendingEdits={hasPendingEdits}
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
