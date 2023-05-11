import React from 'react';

import 'components/social_accounts.scss';

import type NewProfile from '../../models/NewProfile';
import { CWIcon } from './component_kit/cw_icons/cw_icon';
import type { IconName } from './component_kit/cw_icons/cw_icon_lookup';

type SocialAccountProps = {
  iconName: IconName;
  link: string;
};

type SocialAccountsProps = {
  profile: NewProfile;
};

const SocialAccount = (props: SocialAccountProps) => {
  const { iconName, link } = props;
  const formattedLink = link.includes('http') ? link : `https://${link}`;

  return (
    <a href={formattedLink} target="_blank">
      <CWIcon iconName={iconName} className="social-icon" />
    </a>
  );
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
          return <SocialAccount link={social} iconName="twitter" key={i} />;
        } else if (social.includes('discord')) {
          return <SocialAccount link={social} iconName="discord" key={i} />;
        } else if (social.includes('telegram')) {
          return <SocialAccount link={social} iconName="telegram" key={i} />;
        } else if (social.includes('github')) {
          return <SocialAccount link={social} iconName="github" key={i} />;
        } else {
          return <SocialAccount link={social} iconName="website" key={i} />;
        }
      })}
    </div>
  );
};
