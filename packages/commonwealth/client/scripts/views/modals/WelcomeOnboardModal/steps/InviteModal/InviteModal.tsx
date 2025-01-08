import commonLogo from 'assets/img/branding/common-logo.svg';
import referralImage from 'assets/img/referral-background-mobile.png';
import useUserStore from 'client/scripts/state/ui/user';
import { saveToClipboard } from 'client/scripts/utils/clipboard';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import './InviteModal.scss';
type InviteModalProps = {
  onComplete: () => void;
};

const InviteModal = ({ onComplete }: InviteModalProps) => {
  const user = useUserStore();
  const currentUrl = window.location.origin;
  const inviteLink = `${currentUrl}/dashboard?refcode=${user.activeAccount?.address}`;
  const handleCopy = () => {
    saveToClipboard(inviteLink, true).catch(console.error);
  };
  const generatePermalink = (link: string) => {
    const message = 'Hey, check out Common!';
    return `${message} \n${link}`;
  };
  const referrals_Share = [
    {
      id: 1,
      title: 'Share On X',
      icon: 'xTwitter',
      iconStyle: { backgroundColor: '#000000' },
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            generatePermalink(inviteLink),
          )}`,
        ),
    },
    {
      id: 2,
      title: 'Share On Discord',
      icon: 'discordLogo',
      iconStyle: { backgroundColor: '#9555AC' },
      onClick: () =>
        window.open(
          `https://discord.com/channels/@me`,
          '_blank', // Open Discord in a new tab
        ) ||
        navigator.clipboard.writeText(
          `Check this out: ${generatePermalink(inviteLink)}`,
        ),
    },
    {
      id: 3,
      title: 'Copy Link',
      icon: 'linkPhosphor',
      iconStyle: { backgroundColor: '#0079CC' },
      onClick: handleCopy,
    },
  ];

  return (
    <section className="InviteModal">
      <img src={commonLogo} className="logo" />

      <img src={referralImage} className="referral_logo" />

      <CWText type="h2" className="title" isCentered>
        Get a referral bonus for inviting friends to common!{' '}
      </CWText>
      <div className="share_container">
        {referrals_Share.map((referral: any, index: any) => {
          console.log('referral.style', referral.style);
          return (
            // eslint-disable-next-line react/jsx-key
            <div
              className="share_content"
              key={index.toString()}
              onClick={referral.onClick}
            >
              <div className="icon_container" style={referral.iconStyle}>
                <CWIcon iconSize="large" iconName={referral.icon} />
              </div>
              <CWText type="h5" className="label">
                {referral.title}
              </CWText>
            </div>
          );
        })}
      </div>

      <div className="buttons_container">
        <CWButton
          label={'Skip'}
          buttonWidth="wide"
          containerClassName="skip-button"
          onClick={onComplete}
        />
        <CWButton
          label={'Next'}
          buttonWidth="wide"
          onClick={onComplete}
          containerClassName="next-button"
        />
      </div>
    </section>
  );
};

export { InviteModal };
