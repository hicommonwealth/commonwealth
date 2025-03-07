import { categorizeSocialLinks } from 'client/scripts/helpers/link';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import AuthButton from 'client/scripts/views/components/AuthButton';
import React from 'react';
import './SocialLinks.scss';

const SocialLinks = () => {
  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  const {
    discords,
    githubs,
    twitters,
    telegrams,
    warpcasts,
    remainingLinks,
    tiktoks,
    elements,
    slacks,
  } = categorizeSocialLinks(
    (community.social_links || [])
      .filter((link) => link)
      .map((link) => link || ''),
  );

  return (
    <div className="SocialLinks">
      {discords.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="discord"
          onClick={() => window.open(link)}
        />
      ))}
      {twitters.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="x"
          onClick={() => window.open(link)}
        />
      ))}
      {githubs.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="github"
          onClick={() => window.open(link)}
        />
      ))}
      {telegrams.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="telegram"
          onClick={() => window.open(link)}
        />
      ))}
      {warpcasts.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="warpcast"
          onClick={() => window.open(link)}
        />
      ))}
      {tiktoks.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="tiktok"
          onClick={() => window.open(link)}
        />
      ))}
      {elements.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="element"
          onClick={() => window.open(link)}
        />
      ))}
      {[...remainingLinks, ...slacks].map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="website"
          onClick={() => window.open(link)}
        />
      ))}
    </div>
  );
};

export default SocialLinks;
