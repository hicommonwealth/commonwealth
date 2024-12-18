import { notifySuccess } from 'client/scripts/controllers/app/notifications';
import React from 'react';
import { PopoverMenu } from 'views/components/component_kit/CWPopoverMenu';
import { PopoverTriggerProps } from 'views/components/component_kit/new_designs/CWPopover';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

const TWITTER_SHARE_LINK_PREFIX = 'https://twitter.com/intent/tweet?text=';

type SharePopoverProps = {
  linkToShare: string; // This must be a full url https://{domain}/anything
  buttonLabel?: string;
} & Partial<PopoverTriggerProps>;

export const SharePopover = ({
  renderTrigger,
  linkToShare,
  buttonLabel,
}: SharePopoverProps) => {
  const defaultRenderTrigger = (
    onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
  ) => (
    <CWThreadAction
      action="share"
      {...(buttonLabel && { label: buttonLabel })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(e);
      }}
    />
  );

  return (
    <PopoverMenu
      menuItems={[
        {
          iconLeft: 'linkPhosphor',
          iconLeftSize: 'regular',
          label: 'Copy link',
          onClick: () => {
            navigator.clipboard
              .writeText(linkToShare)
              .then(() => {
                notifySuccess('Successfully copied! ');
              })
              .catch(console.error);
          },
        },
        {
          iconLeft: 'twitterOutline',
          iconLeftSize: 'regular',
          label: 'Share on X (Twitter)',
          onClick: () => {
            window.open(`${TWITTER_SHARE_LINK_PREFIX}${linkToShare}`, '_blank');
          },
        },
      ]}
      renderTrigger={renderTrigger || defaultRenderTrigger}
    />
  );
};
