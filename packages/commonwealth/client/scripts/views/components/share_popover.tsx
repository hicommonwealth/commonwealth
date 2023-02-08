/* @jsx jsx */
import React from 'react';

import { ClassComponent, getRoute, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';

import { CWIconButton } from './component_kit/cw_icon_button';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import type { PopoverTriggerProps } from './component_kit/cw_popover/cw_popover';

type SharePopoverAttrs = {
  commentId?: number;
} & Partial<PopoverTriggerProps>;

export class SharePopover extends ClassComponent<SharePopoverAttrs> {
  view(vnode: ResultNode<SharePopoverAttrs>) {
    const {
      commentId,
      renderTrigger = (onclick) => (
        <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
      ),
    } = vnode.attrs;
    const domain = document.location.origin;

    return (
      <PopoverMenu
        menuItems={[
          {
            iconLeft: 'copy',
            label: 'Copy URL',
            onClick: async () => {
              const currentRouteSansCommentParam =
                getRoute().split('?comment=')[0];
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
            onClick: async () => {
              if (!commentId) {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${getRoute()}`,
                  '_blank'
                );
              } else {
                await window.open(
                  `https://twitter.com/intent/tweet?text=${domain}${getRoute()}?comment=${commentId}`,
                  '_blank'
                );
              }
            },
          },
        ]}
        renderTrigger={renderTrigger}
      />
    );
  }
}
