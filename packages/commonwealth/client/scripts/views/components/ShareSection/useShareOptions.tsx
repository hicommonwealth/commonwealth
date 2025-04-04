import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';
import useAppStatus from 'hooks/useAppStatus';
import React, { useCallback, useMemo } from 'react';
import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { ShareOption } from './ShareOption';

export function useShareOptions(
  url: string,
  title?: string,
  text?: string,
): ShareOption[] {
  const { isIOS, isAndroid } = useAppStatus();

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
      await saveToClipboard(url, true);
    }

    doAsync().catch(console.error);
  }, [url]);

  /**
   * Some providers, like Telegram and Twitter, support the url param being
   * text and is not strictly JUST a url. In these situations, if the user
   * has specified the text to send, we include that too.
   */
  const computeCombinedURLPayload = useCallback(() => {
    if (text) {
      return `${url}\n\n${text}`;
    }
    return url;
  }, [text, url]);

  return useMemo(
    () =>
      [
        {
          name: 'Messages',
          icon: messagesImg,
          onClick: () => window.open(url),
        },
        {
          // url+text in URL param: yes
          name: 'Telegram',
          icon: telegramImg,
          onClick: () =>
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(computeCombinedURLPayload())}`,
            ),
        },
        {
          // url+text in URL param: yes
          name: 'X (Twitter)',
          icon: twitterImg,
          onClick: () =>
            window.open(
              `https://twitter.com/intent/tweet?url=${encodeURIComponent(computeCombinedURLPayload())}`,
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
          onClick: () => {
            navigator.share({ url: url, title, text }).catch(console.error);
          },
        },
      ].filter(filterPredicate),
    [computeCombinedURLPayload, filterPredicate, handleCopy, text, title, url],
  );
}
