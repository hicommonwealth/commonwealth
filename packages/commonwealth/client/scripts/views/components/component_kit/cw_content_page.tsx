/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'components/component_kit/cw_content_page.scss';

import app from 'state';
import { AddressInfo, Comment } from 'models';
import { ComponentType, MenuItem } from './types';
import { CWTabBar, CWTab } from './cw_tabs';
import { CWText } from './cw_text';
import { CWPopoverMenu } from './cw_popover/cw_popover_menu';
import { CWIconButton } from './cw_icon_button';
import { isWindowMediumSmallInclusive } from './helpers';
import User from '../widgets/user';

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
  author: string;
  body: m.Vnode;
  createdAt: moment.Moment;
  title: string;

  // optional
  actions?: Array<MenuItem>;
  comments?: Array<Comment<any>>;
  contentBodyLabel?: 'Snapshot' | 'Thread'; // proposals don't need a label because they're never tabbed
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: m.Vnode;
  subHeader?: m.Vnode;
};

export class CWContentPage implements m.ClassComponent<ContentPageAttrs> {
  private viewType: 'sidebarView' | 'tabsView';
  private tabSelected: number;

  onResize(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    this.viewType =
      isWindowMediumSmallInclusive(window.innerWidth) && vnode.attrs.showSidebar
        ? 'tabsView'
        : 'sidebarView';

    m.redraw();
  }

  oninit(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    this.viewType =
      isWindowMediumSmallInclusive(window.innerWidth) && vnode.attrs.showSidebar
        ? 'tabsView'
        : 'sidebarView';

    if (vnode.attrs.sidebarComponents.length > 0) {
      this.tabSelected = 0;
    }

    window.addEventListener('resize', () => {
      this.onResize(vnode);
    });
  }

  onremove(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    window.removeEventListener('resize', () => {
      this.onResize(vnode);
    });
  }

  view(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    const {
      actions,
      author,
      body,
      comments,
      contentBodyLabel,
      createdAt,
      showSidebar,
      sidebarComponents,
      subBody,
      subHeader,
      title,
    } = vnode.attrs;

    const mainBody = (
      <div class="main-body-container">
        <div class="header">
          <CWText type="h3" fontWeight="semiBold">
            {title}
          </CWText>
          <div class="header-info-row">
            <CWText>
              {m(User, {
                user: new AddressInfo(null, author, app.activeChainId(), null),
                showAddressWithDisplayName: true,
                linkify: true,
                popover: true,
              })}
            </CWText>
            <CWText type="caption" className="header-text">
              published on {moment(createdAt).format('l')}
            </CWText>
            {actions && (
              <CWPopoverMenu
                trigger={<CWIconButton iconName="dotsVertical" />}
                menuItems={actions}
              />
            )}
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
