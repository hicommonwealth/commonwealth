import { _DEPRECATED_getRoute } from 'mithrilInterop';
import React from 'react';

import { CWIconButton } from './component_kit/cw_icon_button';
import type { PopoverTriggerProps } from './component_kit/cw_popover/cw_popover';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';

type SharePopoverProps = {
  commentId?: number;
  discussionLink?: string;
} & Partial<PopoverTriggerProps>;

export const SharePopover = (props: SharePopoverProps) => {
  const {
    commentId,
    discussionLink,
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
            const currentRoute = _DEPRECATED_getRoute();
            let urlToCopy = `${domain}${currentRoute}`; // If we copy the thread on discussion page

            if (commentId) {
              // If we copy a comment on discussion page
              const currentRouteSansCommentParam = currentRoute.split('?comment=')[0];
              urlToCopy = `${domain}${currentRouteSansCommentParam}?comment=${commentId}`;
            } else if (discussionLink) {
              const urlParts = currentRoute.split('/');

              const isCustomDomain =
                !domain.includes('//commonwealth.im') &&
                !domain.includes('//localhost')

              // If we copy from a custom domain page, exclude the chain
              if (isCustomDomain){
                urlToCopy = `${domain}${discussionLink}`;
              } else {
                const chainId = urlParts[1];
                urlToCopy = `${domain}/${chainId}${discussionLink}`;
              }
            }

            await navigator.clipboard.writeText(urlToCopy);
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
