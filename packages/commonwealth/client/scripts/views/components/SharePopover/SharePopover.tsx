import { useFlag } from 'hooks/useFlag';
import React from 'react';
import useUserStore from 'state/ui/user';
import { saveToClipboard } from 'utils/clipboard';
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
  const user = useUserStore();
  const referralsEnabled = useFlag('referrals');

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

  const handleCopy = async () => {
    if (referralsEnabled) {
      const refLink =
        // TODO: @Marcin to check address access (referral link creation) + related changes in this file
        linkToShare +
        (user.activeAccount ? `?refcode=${user.activeAccount.address}` : '');
      await saveToClipboard(refLink, true);
    } else {
      await saveToClipboard(linkToShare, true);
    }
  };

  return (
    <PopoverMenu
      menuItems={[
        {
          iconLeft: 'linkPhosphor',
          iconLeftSize: 'regular',
          label: 'Copy link',
          onClick: () => {
            handleCopy().catch(console.error);
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
