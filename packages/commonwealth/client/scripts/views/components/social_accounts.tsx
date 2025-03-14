import React from 'react';
import type NewProfile from '../../models/NewProfile';
import { SocialAccount } from './SocialAccount';
import './social_accounts.scss';

type SocialAccountsProps = {
  profile: NewProfile;
};

export const SocialAccounts = (props: SocialAccountsProps) => {
  const { profile } = props;

  if (!profile) return;

  const { email, socials } = profile;

  return (
    <div className="SocialAccounts">
      {email && <SocialAccount link={`mailto:${email}`} iconName="mail" />}
      {socials?.map((social, i) => {
        if (social.includes('twitter')) {
          return <SocialAccount link={social} iconName="twitterX" key={i} />;
        } else if (social.includes('discord')) {
          return <SocialAccount link={social} iconName="discord" key={i} />;
        } else if (social.includes('telegram')) {
          return <SocialAccount link={social} iconName="telegram" key={i} />;
        } else if (social.includes('t.me')) {
          return <SocialAccount link={social} iconName="telegram" key={i} />;
        } else if (social.includes('github')) {
          return <SocialAccount link={social} iconName="github" key={i} />;
        } else if (social.includes('tiktok')) {
          return <SocialAccount link={social} iconName="tiktok" key={i} />;
        } else if (social.includes('warpcast')) {
          return <SocialAccount link={social} iconName="warpcast" key={i} />;
        } else {
          return <SocialAccount link={social} iconName="website" key={i} />;
        }
      })}
    </div>
  );
};
