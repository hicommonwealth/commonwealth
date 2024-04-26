import React from 'react';
import app from '../../state';

import { useLocation } from 'react-router-dom';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { PopoverTriggerProps } from 'views/components/component_kit/new_designs/CWPopover';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

type SharePopoverProps = {
  commentId?: number;
  discussionLink?: string;
  customUrl?: string;
} & Partial<PopoverTriggerProps>;

export const SharePopover = ({
  commentId,
  discussionLink,
  renderTrigger,
  customUrl,
}: SharePopoverProps) => {
  const domain = document.location.origin;
  const { pathname: currentRoute } = useLocation();

  const defaultRenderTrigger = (
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
  ) => (
    <CWThreadAction
      action="share"
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
    />
  );

  const twitterPrefix = 'https://twitter.com/intent/tweet?text=';

  return (
    <PopoverMenu
      menuItems={[
        {
          iconLeft: 'linkPhosphor',
          iconLeftSize: 'regular',
          label: 'Copy link',
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
                const communityId = urlParts[1];
                if (
                  ['dashboard', 'overview'].includes(communityId.toLowerCase())
                ) {
                  urlToCopy = `${domain}${discussionLink}`;
                } else {
                  urlToCopy = `${domain}/${communityId}${discussionLink}`;
                }
              }
            } else if (customUrl) {
              urlToCopy = `${domain}/${app.activeChainId()}${customUrl}`;
            }

            await navigator.clipboard.writeText(urlToCopy);
          },
        },
        {
          iconLeft: 'twitterOutline',
          iconLeftSize: 'regular',
          label: 'Share on X (Twitter)',
          onClick: async () => {
            if (discussionLink) {
              window.open(
                `${twitterPrefix}${domain}${discussionLink}`,
                '_blank',
              );
            } else if (commentId) {
              const currentRouteSansCommentParam =
                currentRoute.split('?comment=')[0];
              window.open(
                `${twitterPrefix}${domain}${currentRouteSansCommentParam}?comment=${commentId}`,
                '_blank',
              );
            } else {
              window.open(
                `${twitterPrefix}${domain}/${app.activeChainId()}${customUrl}`,
                '_blank',
              );
            }
          },
        },
      ]}
      renderTrigger={renderTrigger || defaultRenderTrigger}
    />
  );
};
