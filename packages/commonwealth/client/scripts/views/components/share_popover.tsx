/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import { CWIconButton } from './component_kit/cw_icon_button';
import { CWPopoverMenu } from './component_kit/cw_popover/cw_popover_menu';

type SharePopoverAttrs = { commentId?: number; trigger?: m.Vnode };

export class SharePopover extends ClassComponent<SharePopoverAttrs> {
  view(vnode: m.Vnode<SharePopoverAttrs>) {
    const { commentId, trigger } = vnode.attrs;
    const domain = document.location.origin;

    return (
      <CWPopoverMenu
        menuItems={[
          {
            iconLeft: 'copy',
            label: 'Copy URL',
            onclick: async () => {
              const currentRouteSansCommentParam = m.route
                .get()
                .split('?comment=')[0];
              if (!commentId) {
                await navigator.clipboard.writeText(
                  `${domain}${currentRouteSansCommentParam}`
                );
              } else {
                await navigator.clipboard.writeText(
                  `${domain}${currentRouteSansCommentParam}?comment=${commentId}`
                );
              }
            },
          },
          {
            iconLeft: 'twitter',
            label: 'Share on Twitter',
            onclick: async () => {
              if (!commentId) {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}`,
                  '_blank'
                );
              } else {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${m.route.get()}?comment=${commentId}`,
                  '_blank'
                );
              }
            },
          },
        ]}
        trigger={trigger || <CWIconButton iconName="share" iconSize="small" />}
      />
    );
  }
}
