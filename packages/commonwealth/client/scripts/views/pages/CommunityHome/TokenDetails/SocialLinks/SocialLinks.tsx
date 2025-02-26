import { categorizeSocialLinks } from 'client/scripts/helpers/link';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import AuthButton from 'client/scripts/views/components/AuthButton';
import React from 'react';
import './SocialLinks.scss';

const SocialLinks = () => {
  const { data: community, isLoading } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  const { discords, githubs, twitters } = categorizeSocialLinks(
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
    </div>
  );
};

export default SocialLinks;
