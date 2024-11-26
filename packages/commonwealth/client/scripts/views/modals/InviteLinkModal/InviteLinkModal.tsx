import React from 'react';

import { saveToClipboard } from 'utils/clipboard';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../components/component_kit/new_designs/CWModal';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';

import discordImg from 'assets/img/share/discord.png';
import mailImg from 'assets/img/share/mail.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import warpcastImg from 'assets/img/share/warpcast.png';
import twitterImg from 'assets/img/share/x.png';

import './InviteLinkModal.scss';

interface InviteLinkModalProps {
  onModalClose: () => void;
  isInsideCommunity: boolean;
}

interface ShareOption {
  name: string;
  icon: string;
  onClick: () => void;
}

const InviteLinkModal = ({
  onModalClose,
  isInsideCommunity,
}: InviteLinkModalProps) => {
  // TODO: replace with actual invite link
  const value = 'https://commonwealth.im/~/invite/774037=89defcb8';

  const handleCopy = async () => {
    await saveToClipboard(value, true);
  };

  const shareOptions: ShareOption[] = [
    {
      name: 'Messages',
      icon: messagesImg,
      onClick: () => window.open(`sms:?&body=${encodeURIComponent(value)}`),
    },
    {
      name: 'Discord',
      icon: discordImg,
      onClick: () =>
        window.open(
          `https://discord.com/share?url=${encodeURIComponent(value)}`,
        ),
    },
    {
      name: 'Telegram',
      icon: telegramImg,
      onClick: () =>
        window.open(`https://t.me/share/url?url=${encodeURIComponent(value)}`),
    },
    {
      name: 'X (Twitter)',
      icon: twitterImg,
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(value)}`,
        ),
    },
    {
      name: 'Warpcast',
      icon: warpcastImg,
      onClick: () =>
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(value)}`,
        ),
    },
    {
      name: 'Email',
      icon: mailImg,
      onClick: () => window.open(`mailto:?body=${encodeURIComponent(value)}`),
    },
  ];

  return (
    <div className="InviteLinkModal">
      <CWModalHeader
        label={
          isInsideCommunity
            ? 'Community invite link'
            : 'Commonwealth invite link'
        }
        onModalClose={onModalClose}
      />
      <CWModalBody>
        <div className="content">
          <CWText>
            {isInsideCommunity
              ? 'Get more voting power in your communities when people join with your referral link.'
              : `When you refer your friends to Common, you'll get a portion of any fees they pay to 
              Common over their lifetime engaging with web 3 native forums.`}
          </CWText>

          <CWTextInput
            fullWidth
            type="text"
            value={value}
            disabled
            onClick={handleCopy}
            iconRight={<CWIcon iconName="copy" />}
          />

          <div className="share-section">
            <CWText fontWeight="bold">Share to</CWText>
            <div className="share-options">
              {shareOptions.map((option) => (
                <div
                  key={option.name}
                  className="share-option"
                  onClick={option.onClick}
                >
                  <img src={option.icon} alt={option.name} className="icon" />
                  <CWText type="caption">{option.name}</CWText>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CWModalBody>
      <CWModalFooter>
        <></>
      </CWModalFooter>
    </div>
  );
};

export default InviteLinkModal;
