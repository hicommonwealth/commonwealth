import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';
import useAppStatus from 'hooks/useAppStatus';
import { useCallback, useMemo } from 'react';

interface ShareOption {
  name: string;
  icon: string;
  requiresMobile?: boolean;
  onClick: () => void;
}

export function useShareOptions(
  url: string,
  title?: string,
  text?: string,
): ShareOption[] {
  const { isIOS, isAndroid } = useAppStatus();

  const mobile = isIOS || isAndroid;

  const filterPredicate = useCallback(
    (option: ShareOption) => {
      if (!option.requiresMobile) {
        // if there's no requiredMobile then it's always suppoted.
        return true;
      }

      return mobile && option.requiresMobile;
    },
    [mobile],
  );

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
          name: 'Share Via',
          icon: 'share',
          requiresMobile: true,
          onClick: () => {
            navigator.share({ url: url, title, text }).catch(console.error);
          },
        },
      ].filter(filterPredicate),
    [filterPredicate, text, title, url],
  );
}
