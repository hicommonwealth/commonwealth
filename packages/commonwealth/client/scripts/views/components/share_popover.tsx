import { _DEPRECATED_getRoute } from 'mithrilInterop';
import React from 'react';

import { CWIconButton } from './component_kit/cw_icon_button';
import type { PopoverTriggerProps } from './component_kit/cw_popover/cw_popover';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';

type SharePopoverProps = {
  commentId?: number;
} & Partial<PopoverTriggerProps>;

export const SharePopover = (props: SharePopoverProps) => {
  const {
    commentId,
    renderTrigger = (onclick) => (
      <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
    ),
  } = props;

  const domain = document.location.origin;

  return (
    <PopoverMenu
      menuItems={[
        {
          iconLeft: 'copy',
          label: 'Copy URL',
          onClick: async () => {
            const currentRouteSansCommentParam =
              _DEPRECATED_getRoute().split('?comment=')[0];
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
                `https://twitter.com/intent/tweet?text=${domain}${_DEPRECATED_getRoute()}`,
                '_blank'
              );
            } else {
              await window.open(
                `https://twitter.com/intent/tweet?text=${domain}${_DEPRECATED_getRoute()}?comment=${commentId}`,
                '_blank'
              );
            }
          },
        },
      ]}
      renderTrigger={renderTrigger}
    />
  );
};
