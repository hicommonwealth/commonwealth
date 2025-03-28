import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';

interface ShareOption {
  name: string;
  icon: string;
  onClick: () => void;
}

export const getShareOptions = (permalink: string): ShareOption[] => [
  {
    name: 'Messages',
    icon: messagesImg,
    onClick: () => window.open(permalink),
  },
  {
    name: 'Telegram',
    icon: telegramImg,
    onClick: () =>
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(permalink)}`,
      ),
  },
  {
    name: 'X (Twitter)',
    icon: twitterImg,
    onClick: () =>
      window.open(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(permalink)}`,
      ),
  },
  {
    name: 'Warpcast',
    icon: warpcastImg,
    onClick: () =>
      window.open(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(permalink)}`,
      ),
  },
  {
    name: 'Email',
    icon: mailImg,
    onClick: () => window.open(`mailto:?body=${encodeURIComponent(permalink)}`),
  },
];
