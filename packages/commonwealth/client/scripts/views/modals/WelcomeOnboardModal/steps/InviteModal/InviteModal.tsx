import referralImage from 'assets/img/referral-background-mobile.png';
import messagesImg from 'assets/img/share/messages.png';
import telegramImg from 'assets/img/share/telegram.png';
import twitterImg from 'assets/img/share/x.png';
import useUserStore from 'client/scripts/state/ui/user';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from 'client/scripts/views/components/component_kit/new_designs/CWTextInput';
import React from 'react';

import './InviteModal.scss';

type InviteModalProps = {
  onComplete: () => void;
};

type ReferralShare = {
  id: number;
  title: string;
  imgSrc: string;
  onClick: () => void;
};

const InviteModal = ({ onComplete }: InviteModalProps) => {
  const user = useUserStore();
  const currentUrl = window.location.origin;
  const userAddress = user.activeAccount
    ? user.activeAccount?.address
    : user?.addresses[0].address;
  const inviteLink = `${currentUrl}/dashboard?refcode=${userAddress}`;

  const handleCopy = () => {
    saveToClipboard(inviteLink, true).catch(console.error);
  };
  const generatePermalink = (link: string) => {
    const message = 'Hey, check out Common!';
    return `${message} \n${link}`;
  };

  const referralsShare: ReferralShare[] = [
    {
      id: 1,
      title: 'Messages',
      imgSrc: messagesImg,
      onClick: () =>
        window.open(
          `sms:?&body=${encodeURIComponent(generatePermalink(inviteLink))}`,
        ),
    },
    {
      id: 2,
      title: 'X',
      imgSrc: twitterImg,
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            generatePermalink(inviteLink),
          )}`,
        ),
    },
    {
      id: 3,
      title: 'Telegram',
      imgSrc: telegramImg,
      onClick: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            generatePermalink(inviteLink),
          )}`,
        ),
    },
  ];

  return (
    <section className="InviteModal">
      <img src={referralImage} className="referral_logo" />

      <CWText type="h2" className="title" isCentered>
        Get a referral bonus for inviting friends to common!{' '}
      </CWText>

      <div className="share-section">
        <CWText fontWeight="bold">Share to</CWText>
        <div className="share-options">
          {referralsShare.map((referral: ReferralShare, index: number) => {
            return (
              <div
                className="share-option"
                key={index.toString()}
                onClick={referral.onClick}
              >
                <img
                  src={referral.imgSrc}
                  alt={referral.title}
                  className="icon"
                />
                <CWText type="caption">{referral.title}</CWText>
              </div>
            );
          })}
        </div>
      </div>

      <CWTextInput
        inputClassName="invite-link-input"
        fullWidth
        type="text"
        value={inviteLink}
        readOnly
        onClick={handleCopy}
        iconRight={<CWIcon iconName="copy" />}
      />

      <div className="buttons_container">
        <CWButton
          label="Skip"
          buttonWidth="wide"
          containerClassName="skip-button"
          onClick={onComplete}
        />
        <CWButton
          label="Next"
          buttonWidth="wide"
          onClick={onComplete}
          containerClassName="next-button"
        />
      </div>
    </section>
  );
};

export { InviteModal };
