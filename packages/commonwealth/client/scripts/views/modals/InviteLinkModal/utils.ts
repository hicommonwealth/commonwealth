import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';

const inviteCommunityMessage = 'Hey, check out my community on Common!';
const inviteCommonMessage = 'Hey, check out Common!';

const generatePermalink = (isInsideCommunity: boolean, inviteLink: string) => {
  const message = isInsideCommunity
    ? inviteCommunityMessage
    : inviteCommonMessage;

  return `${message} \n${inviteLink}`;
};

interface ShareOption {
  name: string;
  icon: string;
  onClick: () => void;
}

export const getShareOptions = (
  isInsideCommunity: boolean,
  inviteLink?: string | null,
): ShareOption[] =>
  inviteLink
    ? [
        {
          name: 'Messages',
          icon: messagesImg,
          onClick: () =>
            window.open(
              `sms:?&body=${encodeURIComponent(generatePermalink(isInsideCommunity, inviteLink))}`,
            ),
        },
        {
          name: 'Telegram',
          icon: telegramImg,
          onClick: () =>
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(
                generatePermalink(isInsideCommunity, inviteLink),
              )}`,
            ),
        },
        {
          name: 'X (Twitter)',
          icon: twitterImg,
          onClick: () =>
            window.open(
              `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                generatePermalink(isInsideCommunity, inviteLink),
              )}`,
            ),
        },
        {
          name: 'Warpcast',
          icon: warpcastImg,
          onClick: () =>
            window.open(
              `https://warpcast.com/~/compose?text=${encodeURIComponent(
                generatePermalink(isInsideCommunity, inviteLink),
              )}`,
            ),
        },
        {
          name: 'Email',
          icon: mailImg,
          onClick: () =>
            window.open(
              `mailto:?body=${encodeURIComponent(
                generatePermalink(isInsideCommunity, inviteLink),
              )}`,
            ),
        },
      ]
    : [];
