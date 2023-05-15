import React from 'react';
import app from '../../state';

import { CWIconButton } from './component_kit/cw_icon_button';
import type { PopoverTriggerProps } from './component_kit/cw_popover/cw_popover';
import { PopoverMenu } from './component_kit/cw_popover/cw_popover_menu';
import { useLocation } from 'react-router-dom';

type SharePopoverProps = {
  commentId?: number;
  discussionLink?: string;
} & Partial<PopoverTriggerProps>;

export const SharePopover = ({
  commentId,
  discussionLink,
  renderTrigger,
}: SharePopoverProps) => {
  const domain = document.location.origin;
  const { pathname: currentRoute } = useLocation();

  const defaultRenderTrigger = (onclick) => (
    <CWIconButton iconName="share" iconSize="small" onClick={onclick} />
  );

  return (
    <PopoverMenu
      menuItems={[
        {
          iconLeft: 'copy',
          label: 'Copy URL',
          onClick: async () => {
            let urlToCopy = `${domain}${currentRoute}`; // If we copy the thread on discussion page

            if (commentId) {
              // If we copy a comment on discussion page
              const currentRouteSansCommentParam =
                currentRoute.split('?comment=')[0];
              urlToCopy = `${domain}${currentRouteSansCommentParam}?comment=${commentId}`;
            } else if (discussionLink) {
              const urlParts = currentRoute.split('/');

              // If we copy from a custom domain page, exclude the chain
              if (app.isCustomDomain()) {
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
                `https://twitter.com/intent/tweet?text=${domain}${discussionLink}`,
                '_blank'
              );
            } else {
              await window.open(
                `https://twitter.com/intent/tweet?text=${domain}${discussionLink}?comment=${commentId}`,
                '_blank'
              );
            }
          },
        },
      ]}
      renderTrigger={renderTrigger || defaultRenderTrigger}
    />
  );
};
