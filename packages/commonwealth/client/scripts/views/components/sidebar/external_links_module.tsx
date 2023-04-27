import React from 'react';

import 'components/sidebar/external_links_module.scss';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

export const ExternalLinksModule = () => {
  if (!app.chain) return;
  const meta = app.chain.meta;
  const { website, discord, element, telegram, github } = meta;

  if (!website && !discord && !telegram && !github) return;

  return (
    <div className="ExternalLinksModule">
      {discord && (
        <CWIcon
          iconName="discord"
          className="discord-link"
          onClick={() => window.open(discord)}
        />
      )}
      {element && (
        <CWIcon
          iconName="element"
          className="element-link"
          onClick={() => window.open(element)}
        />
      )}
      {telegram && (
        <CWIcon
          iconName="telegram"
          className="telegram-link"
          onClick={() => window.open(telegram)}
        />
      )}
      {github && (
        <CWIcon
          iconName="github"
          className="github-link"
          onClick={() => window.open(github)}
        />
      )}
      {website && (
        <CWIcon
          iconName="website"
          className="website-link"
          onClick={() => window.open(website)}
        />
      )}
    </div>
  );
};
