import React, { useState } from 'react';
import type NewProfile from '../../models/NewProfile';
import { SocialAccount } from './SocialAccount';
import './social_accounts.scss';

type SocialAccountsProps = {
  profile: NewProfile;
};

export const SocialAccounts = ({ profile }: SocialAccountsProps) => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  if (!profile) return;

  const { email, socials } = profile;

  const handleModalClose = () => {
    setSelectedLink(null);
  };

  return (
    <div className="SocialAccounts">
      {email && (
        <SocialAccount
          link={`mailto:${email}`}
          iconName="mail"
          isSelected={selectedLink === `mailto:${email}`}
          onSelect={setSelectedLink}
          onModalClose={handleModalClose}
        />
      )}
      {socials?.map((social, i) => {
        if (social.includes('twitter')) {
          return (
            <SocialAccount
              link={social}
              iconName="twitterX"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('discord')) {
          return (
            <SocialAccount
              link={social}
              iconName="discord"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('telegram')) {
          return (
            <SocialAccount
              link={social}
              iconName="telegram"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('t.me')) {
          return (
            <SocialAccount
              link={social}
              iconName="telegram"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('github')) {
          return (
            <SocialAccount
              link={social}
              iconName="github"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('tiktok')) {
          return (
            <SocialAccount
              link={social}
              iconName="tiktok"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else if (social.includes('warpcast')) {
          return (
            <SocialAccount
              link={social}
              iconName="warpcast"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        } else {
          return (
            <SocialAccount
              link={social}
              iconName="website"
              key={i}
              isSelected={selectedLink === social}
              onSelect={setSelectedLink}
              onModalClose={handleModalClose}
            />
          );
        }
      })}
    </div>
  );
};
