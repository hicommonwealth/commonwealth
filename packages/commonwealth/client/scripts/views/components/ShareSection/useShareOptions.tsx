import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';
import useAppStatus from 'hooks/useAppStatus';
import { useFlag } from 'hooks/useFlag';
import React, { ReactNode, useCallback, useMemo } from 'react';
import useUserStore from 'state/ui/user';
import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

interface ShareOption {
  name: string;
  icon: string | ReactNode;
  requiresMobile?: boolean;
  onClick: () => void;
}

export function useShareOptions(
  url: string,
  title?: string,
  text?: string,
): ShareOption[] {
  const { isIOS, isAndroid } = useAppStatus();
  const referralsEnabled = useFlag('referrals');
  const user = useUserStore();

  const mobile = isIOS || isAndroid;

  const filterPredicate = useCallback(
    (option: ShareOption): boolean => {
      if (!option.requiresMobile) {
        // if there's no requiredMobile then it's always supported.
        return true;
      }

      return mobile && option.requiresMobile;
    },
    [mobile],
  );

  const handleCopy = useCallback(() => {
    async function doAsync() {
      if (referralsEnabled && url.startsWith('https://common.xyz/')) {
        const refLink =
          // TODO: @Marcin to check address access (referral link creation) + related changes in this file
          url +
          (user.activeAccount ? `?refcode=${user.activeAccount.address}` : '');
        await saveToClipboard(refLink, true);
      } else {
        await saveToClipboard(url, true);
      }
    }

    doAsync().catch(console.error);
  }, [referralsEnabled, url, user.activeAccount]);

  return useMemo(
    () =>
      [
        {
          name: 'Messages',
          icon: messagesImg,
          onClick: () => window.open(url),
        },
        {
          name: 'Telegram',
          icon: telegramImg,
          onClick: () =>
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(url)}`,
            ),
        },
        {
          name: 'X (Twitter)',
          icon: twitterImg,
          onClick: () =>
            window.open(
              `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
            ),
        },
        {
          name: 'Warpcast',
          icon: warpcastImg,
          onClick: () =>
            window.open(
              `https://warpcast.com/~/compose?text=${encodeURIComponent(url)}`,
            ),
        },
        {
          name: 'Email',
          icon: mailImg,
          onClick: () => window.open(`mailto:?body=${encodeURIComponent(url)}`),
        },
        {
          name: 'Copy Link',
          icon: <CWIcon iconName="copy" iconSize="xl" />,
          onClick: () => {
            handleCopy();
          },
        },
        {
          name: 'Share Via',
          icon: <CWIcon iconName="share2" iconSize="xl" />,
          requiresMobile: true,
          onClick: () => {
            navigator.share({ url: url, title, text }).catch(console.error);
          },
        },
      ].filter(filterPredicate),
    [filterPredicate, handleCopy, text, title, url],
  );
}
