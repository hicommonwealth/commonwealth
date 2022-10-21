import m from 'mithril';

import 'components/component_kit/cw_content_page.scss';

import { Comment } from 'models';
import { ComponentType, MenuItem } from './types';
import { CWTabBar, CWTab } from './cw_tabs';
import { CWText } from './cw_text';
import { CWPopoverMenu } from './cw_popover/cw_popover_menu';
import { CWIconButton } from './cw_icon_button';
import { getClasses } from './helpers';

type SidebarItem = {
  label: string;
  item: m.Vnode;
};

type SidebarComponents = [
  item?: SidebarItem,
  item?: SidebarItem,
  item?: SidebarItem
];

type ContentPageAttrs = {
  actions?: Array<MenuItem>;
  author: string;
  body: m.Vnode;
  comments?: Array<Comment<any>>;
  createdAt: moment.Moment;
  showSidebar?: boolean;
  sidebarComponents?: SidebarComponents;
  subBody?: m.Vnode;
  subHeader?: m.Vnode;
  title: string;
  updatedAt?: moment.Moment;
};

export class CWContentPage implements m.ClassComponent<ContentPageAttrs> {
  private tabSelected: number;

  oninit(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    if (vnode.attrs.sidebarComponents.length > 0) {
      this.tabSelected = 0;
    }
  }

  view(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    const {
      actions,
      author,
      body,
      comments,
      createdAt,
      showSidebar,
      sidebarComponents,
      subBody,
      subHeader,
      title,
      updatedAt,
    } = vnode.attrs;

    return (
      <div class={ComponentType.ContentPage}>
        <div
          class={getClasses<{ showSidebar?: boolean }>(
            { showSidebar },
            'body-with-tabs'
          )}
        >
          <CWTabBar>
            <CWTab
              label="Thread"
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
          {this.tabSelected === 0 && body}
          {this.tabSelected === 1 && sidebarComponents[0]}
          {this.tabSelected === 2 && sidebarComponents[1]}
          {this.tabSelected === 3 && sidebarComponents[2]}
        </div>
        <div
          class={getClasses<{ showSidebar?: boolean }>({ showSidebar }, 'body')}
        >
          <div>
            <CWText>{title}</CWText>
            <CWText>{author}</CWText>
            <CWText>{createdAt}</CWText>
            <CWText>{updatedAt}</CWText>
            <CWPopoverMenu
              trigger={<CWIconButton iconName="dotsVertical" />}
              menuItems={actions}
            />
          </div>
          {subHeader}
          {body}
          {comments}
          {subBody}
          {showSidebar && sidebarComponents}
        </div>
      </div>
    );
  }
}
