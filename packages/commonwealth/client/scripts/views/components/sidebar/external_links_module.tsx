/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/sidebar/external_links_module.scss';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

export class ExternalLinksModule extends ClassComponent {
  view() {
    if (!app.chain) return;
    const meta = app.chain.meta;
    const { website, discord, element, telegram, github } = meta;

    if (!website && !discord && !telegram && !github) return;

    return (
      <div className="ExternalLinksModule">
        {discord && (
          <CWIcon
            iconName="discord"
            class="discord-link"
            onClick={() => window.open(discord)}
          />
        )}
        {element && (
          <CWIcon
            iconName="element"
            class="element-link"
            onClick={() => window.open(element)}
          />
        )}
        {telegram && (
          <CWIcon
            iconName="telegram"
            class="telegram-link"
            onClick={() => window.open(telegram)}
          />
        )}
        {github && (
          <CWIcon
            iconName="github"
            class="github-link"
            onClick={() => window.open(github)}
          />
        )}
        {website && (
          <CWIcon
            iconName="website"
            class="website-link"
            onClick={() => window.open(website)}
          />
        )}
      </div>
    );
  }
}
