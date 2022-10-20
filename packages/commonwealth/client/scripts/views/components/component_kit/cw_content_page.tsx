import m from 'mithril';

import 'components/component_kit/cw_content_page.scss';

import { ComponentType } from './types';
import { CWTabBar, CWTab } from './cw_tabs';
import { getClasses } from './helpers';

// type ContentPageAttrs = {
//     title: string;
//     author: string;
//     createdAt: moment.Moment;
//     updatedAt: moment.Moment;
//     actions: Array<PopoverMenuItem>

//     subHeader?: m.Vnode; // for misc chain needs
//     body: FormattedText; // all transforms done in controller or earlier
//     subBody?: m.Vnode; // for misc chain needs
//     sidebar?: Array<SidebarItem>; // for misc chain needs
//     comments?: Array<Comments>; // optional because snapshots don't need them,
//                                 // all transforms done in controller or earlier

//     onThreadVote: () => void;
//     onThreadLock: () => void;
//     onThreadDelete: () => void;
//     onCommentCreate: () => void;
//     onCommentUpdate: () => void;
//     onCommentDelete: () => void;
//   }

type SidebarItem = {
  label: string;
  item: m.Vnode;
};

type ContentPageAttrs = {
  body: m.Vnode;
  showSidebar?: boolean;
  // tuple, not array
  sidebarComponents?: [
    item?: SidebarItem,
    item?: SidebarItem,
    item?: SidebarItem,
    item?: SidebarItem
  ];
};

export class CWContentPage implements m.ClassComponent<ContentPageAttrs> {
  private tabSelected: number;

  //

  oninit(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    if (vnode.attrs.sidebarComponents.length > 0) {
      this.tabSelected = 0;
    }
  }

  view(vnode: m.VnodeDOM<ContentPageAttrs, this>) {
    const { body, showSidebar, sidebarComponents } = vnode.attrs;

    return (
      <div class={ComponentType.ContentPage}>
        <div
          class={getClasses<{ showSidebar?: boolean }>(
            { showSidebar },
            'body-with-tabs'
          )}
        >
          <CWTabBar>
            {sidebarComponents.map((item, i) => (
              <CWTab
                label={item.label}
                onclick={() => {
                  this.tabSelected = i;
                }}
                isSelected={this.tabSelected === i}
              />
            ))}
          </CWTabBar>
          {this.tabSelected === 'viewProposal' && body}
          {showSidebar &&
            this.tabSelected === 'viewSidebar' &&
            sidebarComponents}
        </div>
        <div
          class={getClasses<{ showSidebar?: boolean }>({ showSidebar }, 'body')}
        >
          {body}
          {showSidebar && sidebarComponents}
        </div>
      </div>
    );
  }
}
