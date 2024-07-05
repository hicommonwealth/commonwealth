import 'components/social_accounts.scss';
import React from 'react';
import type NewProfile from '../../models/NewProfile';
import { SocialAccount } from './SocialAccount';
import type { CategorizedSocialLinks } from '../../models/ChainInfo';

type SocialAccountsProps = {
  profile?: NewProfile;
  socialLinks?: CategorizedSocialLinks;
};

export const SocialAccounts = ({ profile, socialLinks }: SocialAccountsProps) => {
  if (socialLinks) {
    const { discords, githubs, telegrams, twitters, elements, remainingLinks } = socialLinks;

    return (
      <div className="SocialAccounts">
        {discords.map((link, i) => (
          <SocialAccount link={link} iconName="discord" key={`discord-${i}`} />
        ))}
        {githubs.map((link, i) => (
          <SocialAccount link={link} iconName="github" key={`github-${i}`} />
        ))}
        {telegrams.map((link, i) => (
          <SocialAccount link={link} iconName="telegram" key={`telegram-${i}`} />
        ))}
        {twitters.map((link, i) => (
          <SocialAccount link={link} iconName="twitterX" key={`twitter-${i}`} />
        ))}
        {elements.map((link, i) => (
          <SocialAccount link={link} iconName="element" key={`element-${i}`} />
        ))}
        {remainingLinks.map((link, i) => (
          <SocialAccount link={link} iconName="website" key={`other-${i}`} />
        ))}
      </div>
    );
  }

  if (!profile) return null;

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
        } else {
          return <SocialAccount link={social} iconName="website" key={i} />;
        }
      })}
    </div>
  );
};