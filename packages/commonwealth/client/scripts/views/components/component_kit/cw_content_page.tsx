/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'components/component_kit/cw_content_page.scss';

import { Comment } from 'models';
import { pluralize } from 'helpers';
import { ComponentType, MenuItem } from './types';
import { CWTabBar, CWTab } from './cw_tabs';
import { CWText } from './cw_text';
import { CWPopoverMenu } from './cw_popover/cw_popover_menu';
import { CWIconButton } from './cw_icon_button';
import { isWindowMediumSmallInclusive } from './helpers';
import { CWIcon } from './cw_icons/cw_icon';
import { SharePopover } from '../share_popover';
import { CWCard } from './cw_card';

type SidebarItem = {
  label: string;
  item: m.Vnode;
};

// tuple
type SidebarComponents = [
  item?: SidebarItem,
  item?: SidebarItem,
  item?: SidebarItem
];

type ContentPageAttrs = {
  createdAt: moment.Moment | number;
  title: string | m.Vnode;

  // optional
  author?: m.Vnode;
  actions?: Array<MenuItem>;
  body?: m.Vnode;
  comments?: Array<Comment<any>>;
  contentBodyLabel?: 'Snapshot' | 'Thread'; // proposals don't need a label because they're never tabbed
  headerComponents?: m.Vnode;
  readOnly?: boolean;
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: m.Vnode;
  subHeader?: m.Vnode;
  viewCount?: number;
};

export class CWContentPage implements m.ClassComponent<ContentPageAttrs> {
  private viewType: 'sidebarView' | 'tabsView';
  private tabSelected: number;

  onResize(vnode: m.Vnode<ContentPageAttrs>) {
    this.viewType =
      isWindowMediumSmallInclusive(window.innerWidth) && vnode.attrs.showSidebar
        ? 'tabsView'
        : 'sidebarView';

    m.redraw();
  }

  oninit(vnode: m.Vnode<ContentPageAttrs>) {
    this.viewType =
      isWindowMediumSmallInclusive(window.innerWidth) && vnode.attrs.showSidebar
        ? 'tabsView'
        : 'sidebarView';

    if (vnode.attrs.sidebarComponents?.length > 0) {
      this.tabSelected = 0;
    }

    window.addEventListener('resize', () => {
      this.onResize(vnode);
    });
  }

  onremove(vnode: m.Vnode<ContentPageAttrs>) {
    window.removeEventListener('resize', () => {
      this.onResize(vnode);
    });
  }

  view(vnode: m.Vnode<ContentPageAttrs>) {
    const {
      actions,
      author,
      body,
      comments,
      contentBodyLabel,
      createdAt,
      headerComponents,
      readOnly,
      showSidebar,
      sidebarComponents,
      subBody,
      subHeader,
      title,
      viewCount,
    } = vnode.attrs;

    const mainBody = (
      <div class="main-body-container">
        <div class="header">
          {typeof title === 'string' ? (
            <CWText type="h3" fontWeight="semiBold">
              {title}
            </CWText>
          ) : (
            title
          )}
          <div class="header-info-row">
            {author}
            {typeof createdAt === 'number' ||
              (moment.isMoment(createdAt) && createdAt.isValid() && (
                <CWText type="caption" className="header-text">
                  published on {moment(createdAt).format('l')}
                </CWText>
              ))}
            {!!viewCount && (
              <CWText type="caption" className="header-text">
                {pluralize(viewCount, 'view')}
              </CWText>
            )}
            {headerComponents}
            {readOnly && <CWIcon iconName="lock" iconSize="small" />}
            {actions && (
              <CWPopoverMenu
                trigger={
                  <CWIconButton iconName="dotsVertical" iconSize="small" />
                }
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
      <div class={ComponentType.ContentPage}>
        {this.viewType === 'sidebarView' && (
          <div class="sidebar-view">
            {mainBody}
            {showSidebar && (
              <div class="sidebar">{sidebarComponents.map((c) => c.item)}</div>
            )}
          </div>
        )}
        {this.viewType === 'tabsView' && (
          <div class="tabs-view">
            <CWTabBar>
              <CWTab
                label={contentBodyLabel}
                onclick={() => {
                  this.tabSelected = 0;
                }}
                isSelected={this.tabSelected === 0}
              />
              {sidebarComponents.map((item, i) => (
                <CWTab
                  label={item.label}
                  onclick={() => {
                    this.tabSelected = i + 1;
                  }}
                  isSelected={this.tabSelected === i + 1}
                />
              ))}
            </CWTabBar>
            {this.tabSelected === 0 && mainBody}
            {sidebarComponents.length >= 1 &&
              this.tabSelected === 1 &&
              sidebarComponents[0].item}
            {sidebarComponents.length >= 2 &&
              this.tabSelected === 2 &&
              sidebarComponents[1].item}
            {sidebarComponents.length === 3 &&
              this.tabSelected === 3 &&
              sidebarComponents[2].item}
          </div>
        )}
      </div>
    );
  }
}

type ContentPageCardAttrs = {
  content: m.Vnode;
  header: string;
};

export class CWContentPageCard
  implements m.ClassComponent<ContentPageCardAttrs>
{
  view(vnode: m.Vnode<ContentPageCardAttrs>) {
    const { content, header } = vnode.attrs;

    return (
      <CWCard className="ContentPageCard">
        <div class="header-container">
          <CWText type="h5" fontWeight="semiBold">
            {header}
          </CWText>
        </div>
        {content}
      </CWCard>
    );
  }
}
