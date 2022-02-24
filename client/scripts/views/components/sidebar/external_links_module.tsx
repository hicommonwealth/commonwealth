/* @jsx m */

import m from 'mithril';
import { Button, Tooltip } from 'construct-ui';

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
          <Tooltip
            transitionDuration={100}
            content="Discord"
            trigger={
              <Button
                rounded={true}
                onclick={() => window.open(discord)}
                label={<CWIcon iconName="discord" />}
                class="discord-button"
              />
            }
          />
        )}
        {element && (
          <Tooltip
            transitionDuration={100}
            content="Element"
            trigger={
              <Button
                rounded={true}
                onclick={() => window.open(element)}
                label={<CWIcon iconName="element" />}
                class="element-button"
              />
            }
          />
        )}
        {telegram && (
          <Tooltip
            transitionDuration={100}
            content="Telegram"
            trigger={
              <Button
                rounded={true}
                onclick={() => window.open(telegram)}
                label={<CWIcon iconName="telegram" />}
                class="telegram-button"
              />
            }
          />
        )}
        {github && (
          <Tooltip
            transitionDuration={100}
            content="Github"
            trigger={
              <Button
                rounded={true}
                onclick={() => window.open(github)}
                label={<CWIcon iconName="github" />}
                class="github-button"
              />
            }
          />
        )}
        {website && (
          <Tooltip
            transitionDuration={100}
            content="Homepage"
            trigger={
              <Button
                rounded={true}
                onclick={() => window.open(website)}
                label={<CWIcon iconName="website" />}
                class="website-button"
              />
            }
          />
        )}
      </div>
    );
  }
}
