/* @jsx m */

import m from 'mithril';

import 'components/sidebar/external_links_module.scss';

import app from 'state';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

export class ExternalLinksModule implements m.ClassComponent {
  view() {
    if (!app.chain) return;
    const meta = app.chain.meta.chain;
    const { website, discord, element, telegram, github } = meta;

    if (!website && !discord && !telegram && !github) return;

    return (
      <div class="ExternalLinksModule">
        {discord && (
          <CWIcon
            iconName="discord"
            className="discord-link"
            onclick={() => window.open(discord)}
          />
        )}
        {element && (
          <CWIcon
            iconName="element"
            className="element-link"
            onclick={() => window.open(element)}
          />
        )}
        {telegram && (
          <CWIcon
            iconName="telegram"
            className="telegram-link"
            onclick={() => window.open(telegram)}
          />
        )}
        {github && (
          <CWIcon
            iconName="github"
            className="github-link"
            onclick={() => window.open(github)}
          />
        )}
        {website && (
          <CWIcon
            iconName="website"
            className="website-link"
            onclick={() => window.open(website)}
          />
        )}
      </div>
    );
  }
}
