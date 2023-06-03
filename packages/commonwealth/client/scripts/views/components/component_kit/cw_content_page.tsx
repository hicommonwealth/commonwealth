import React from 'react';

import moment from 'moment';

import 'components/component_kit/cw_content_page.scss';

import { pluralize } from 'helpers';
import { NewThreadTag } from '../../pages/discussions/NewThreadTag';
import { PopoverMenu } from './cw_popover/cw_popover_menu';
import type { PopoverMenuItem } from './cw_popover/cw_popover_menu';
import { SharePopover } from '../share_popover';
import { CWCard } from './cw_card';
import { CWIconButton } from './cw_icon_button';
import { CWTab, CWTabBar } from './cw_tabs';
import { CWText } from './cw_text';
import { ComponentType } from './types';
import { LockWithTooltip } from '../lock_with_tooltip';
import { isWindowMediumSmallInclusive } from './helpers';

export type ContentPageSidebarItem = {
  label: string;
  item: React.ReactNode;
};

// tuple
export type SidebarComponents = [
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem,
  item?: ContentPageSidebarItem,
  ...ContentPageSidebarItem[]
];

type ContentPageProps = {
  createdAt: moment.Moment | number;
  updatedAt?: moment.Moment;
  title: string | React.ReactNode;

  // optional
  lastEdited?: moment.Moment | number;
  author?: React.ReactNode;
  actions?: Array<PopoverMenuItem>;
  body?: React.ReactNode;
  comments?: React.ReactNode;
  contentBodyLabel?: 'Snapshot' | 'Thread'; // proposals don't need a label because they're never tabbed
  headerComponents?: React.ReactNode;
  readOnly?: boolean;
  lockedAt?: moment.Moment;
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: React.ReactNode;
  subHeader?: React.ReactNode;
  viewCount?: number;
  displayNewTag?: boolean;
  showTabs?: boolean;
};

export const CWContentPage = (props: ContentPageProps) => {
  const {
    actions,
    author,
    body,
    comments,
    contentBodyLabel,
    createdAt,
    updatedAt,
    lastEdited,
    headerComponents,
    readOnly,
    lockedAt,
    showSidebar,
    sidebarComponents,
    subBody,
    subHeader,
    title,
    viewCount,
    displayNewTag,
    showTabs = false,
  } = props;

  const [tabSelected, setTabSelected] = React.useState<number>(0);
  const createdOrEditedDate = lastEdited ? lastEdited : createdAt;
  const createdOrEditedText = lastEdited ? 'Edited' : 'Published';

  React.useEffect(() => {
    const onResize = () => {
      isWindowMediumSmallInclusive(window.innerWidth) && showSidebar
        ? 'tabsView'
        : 'sidebarView';
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainBody = (
    <div className="main-body-container">
      <div className="header">
        {typeof title === 'string' ? (
          <CWText className="title" type="h3" fontWeight="semiBold">
            {title}
          </CWText>
        ) : (
          title
        )}
        <div className="header-info-row">
          {author}
          {typeof createdOrEditedDate === 'number' ||
            (moment.isMoment(createdOrEditedDate) &&
              createdOrEditedDate.isValid() && (
                <CWText type="caption" className="header-text">
                  • &nbsp; {createdOrEditedText} on{' '}
                  {moment(createdOrEditedDate).format('l')} &nbsp; •
                </CWText>
              ))}
          {!!viewCount && (
            <CWText type="caption" className="header-text">
              {pluralize(viewCount, 'view')}
            </CWText>
          )}
          {headerComponents}
          {readOnly && (
            <LockWithTooltip lockedAt={lockedAt} updatedAt={updatedAt} />
          )}
          {actions && (
            <PopoverMenu
              renderTrigger={(onclick) => (
                <CWIconButton
                  iconName="dotsVertical"
                  iconSize="small"
                  onClick={onclick}
                />
              )}
              menuItems={actions}
            />
          )}
          <SharePopover />
        </div>
      </div>
      {subHeader}
      {body}
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
  content: React.ReactNode;
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
