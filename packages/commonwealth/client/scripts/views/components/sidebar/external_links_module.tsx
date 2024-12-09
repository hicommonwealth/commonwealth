import { categorizeSocialLinks } from 'helpers/link';
import React from 'react';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import CWCircleMultiplySpinner from '../component_kit/new_designs/CWCircleMultiplySpinner';
import './external_links_module.scss';

export const ExternalLinksModule = () => {
  const { data: community, isLoading } = useGetCommunityByIdQuery({
    id: app.activeChainId() || '',
    enabled: !!app.activeChainId(),
  });

  if (!app.chain || !community) return;

  if (isLoading) return <CWCircleMultiplySpinner />;

  const {
    discords,
    elements,
    githubs,
    remainingLinks,
    slacks,
    telegrams,
    tiktoks,
    twitters,
  } = categorizeSocialLinks(
    (community.social_links || [])
      .filter((link) => link)
      .map((link) => link || ''),
  );

  return (
    <div className="ExternalLinksModule">
      {discords.map((link) => (
        <CWIcon
          key={link}
          iconName="discord"
          className="discord-link"
          onClick={() => window.open(link)}
        />
      ))}
      {elements.map((link) => (
        <CWIcon
          key={link}
          iconName="element"
          className="element-link"
          onClick={() => window.open(link)}
        />
      ))}
      {telegrams.map((link) => (
        <CWIcon
          key={link}
          iconName="telegram"
          className="telegram-link"
          onClick={() => window.open(link)}
        />
      ))}
      {tiktoks.map((link) => (
        <CWIcon
          key={link}
          iconName="tiktok"
          className="tiktok-link"
          onClick={() => window.open(link)}
        />
      ))}
      {twitters.map((link) => (
        <CWIcon
          key={link}
          iconName="twitterX"
          className="twitter-link"
          onClick={() => window.open(link)}
        />
      ))}
      {githubs.map((link) => (
        <CWIcon
          key={link}
          iconName="github"
          className="github-link"
          onClick={() => window.open(link)}
        />
      ))}
      {[...remainingLinks, ...slacks].map((link) => (
        <CWIcon
          key={link}
          iconName="website"
          className="website-link"
          onClick={() => window.open(link)}
        />
      ))}
    </div>
  );
};
