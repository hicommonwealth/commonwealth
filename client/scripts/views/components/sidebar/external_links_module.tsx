/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

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
          <Button
            rounded={true}
            title="Discord"
            onclick={() => window.open(discord)}
            label={<CWIcon iconName="discord" />}
            class="discord-button"
          />
        )}
        {element && (
          <Button
            rounded={true}
            title="Element"
            onclick={() => window.open(element)}
            label={<CWIcon iconName="element" />}
            class="element-button"
          />
        )}
        {telegram && (
          <Button
            rounded={true}
            title="Telegram"
            onclick={() => window.open(telegram)}
            label={<CWIcon iconName="telegram" />}
            class="telegram-button"
          />
        )}
        {github && (
          <Button
            rounded={true}
            title="Github"
            onclick={() => window.open(github)}
            label={<CWIcon iconName="github" />}
            class="github-button"
          />
        )}
        {website && (
          <Button
            rounded={true}
            title="Homepage"
            onclick={() => window.open(website)}
            label={<CWIcon iconName="website" />}
            class="website-button"
          />
        )}
      </div>
    );
  }
}
