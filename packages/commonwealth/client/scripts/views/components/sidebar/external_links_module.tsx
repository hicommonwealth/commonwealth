import { categorizeSocialLinks } from 'helpers/link';
import React, { useState } from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { SocialAccountLinkModal } from '../../modals/SocialAccountLinkModal/SocialAccountLinkModal';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import CWCircleMultiplySpinner from '../component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../component_kit/new_designs/CWModal';
import './external_links_module.scss';

export const ExternalLinksModule = () => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const { data: community, isLoading } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  if (isLoading) return <CWCircleMultiplySpinner />;

  const handleModalClose = () => {
    setSelectedLink(null);
  };

  const formatLink = (link: string) => {
    return link.includes('http') ? link : `https://${link}`;
  };

  const {
    discords,
    elements,
    githubs,
    remainingLinks,
    slacks,
    telegrams,
    tiktoks,
    twitters,
    warpcasts,
  } = categorizeSocialLinks(
    (community.social_links || [])
      .filter((link) => link)
      .map((link) => link || ''),
  );

  return (
    <div className="ExternalLinksModule">
      {discords.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="discord"
            className="discord-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {elements.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="element"
            className="element-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {telegrams.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="telegram"
            className="telegram-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {tiktoks.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="tiktok"
            className="tiktok-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {twitters.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="twitterX"
            className="twitter-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {githubs.map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="github"
            className="github-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
      ))}
      {warpcasts.map((link) => (
        <CWIcon
          key={link}
          iconName="warpcast"
          className="warpcast-link"
          onClick={() => window.open(link)}
        />
      ))}
      {[...remainingLinks, ...slacks].map((link) => (
        <React.Fragment key={link}>
          <CWIcon
            iconName="website"
            className="website-link"
            onClick={() => setSelectedLink(link)}
          />
        </React.Fragment>
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
