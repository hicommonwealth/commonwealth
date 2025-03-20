import { categorizeSocialLinks } from 'client/scripts/helpers/link';
import app from 'client/scripts/state';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import AuthButton from 'client/scripts/views/components/AuthButton';
import React, { useState } from 'react';
import { CWModal } from '../../../../components/component_kit/new_designs/CWModal';
import { SocialAccountLinkModal } from '../../../../modals/SocialAccountLinkModal/SocialAccountLinkModal';
import './SocialLinks.scss';

const SocialLinks = () => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const { data: community } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  const handleModalClose = () => {
    setSelectedLink(null);
  };

  const formatLink = (link: string) => {
    return link.includes('http') ? link : `https://${link}`;
  };

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
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {twitters.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="x"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {githubs.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="github"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {telegrams.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="telegram"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {warpcasts.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="warpcast"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {tiktoks.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="tiktok"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {elements.map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="element"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {[...remainingLinks, ...slacks].map((link) => (
        <AuthButton
          className="autoWidth"
          key={link}
          type="website"
          onClick={() => setSelectedLink(link)}
        />
      ))}
      {selectedLink && (
        <CWModal
          size="small"
          content={
            <SocialAccountLinkModal
              onModalClose={handleModalClose}
              formattedLink={formatLink(selectedLink)}
            />
          }
          onClose={handleModalClose}
          open={true}
        />
      )}
    </div>
  );
};

export default SocialLinks;
