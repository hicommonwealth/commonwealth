import React from 'react';

import 'components/sidebar/external_links_module.scss';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

export const ExternalLinksModule = () => {
  if (!app.chain) return;
  const meta = app.chain.meta;
  const { remainingLinks, discords, elements, telegrams, githubs } =
    meta.categorizeSocialLinks();

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
      {githubs.map((link) => (
        <CWIcon
          key={link}
          iconName="github"
          className="github-link"
          onClick={() => window.open(link)}
        />
      ))}
      {remainingLinks.map((link) => (
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
