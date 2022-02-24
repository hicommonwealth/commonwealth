/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import {
  Button,
  PopoverMenu,
  MenuItem,
  Icon,
  Icons,
  Tooltip,
} from 'construct-ui';

import 'components/sidebar/index.scss';

import { selectNode, initChain } from 'app';
import app from 'state';
import { link } from 'helpers';
import { ChainInfo, NodeInfo } from 'models';
import { SubscriptionButton } from 'views/components/subscription_button';
import { ChainStatusIndicator } from 'views/components/chain_status_indicator';
import { ChainIcon } from 'views/components/chain_icon';
import { CommunitySelector } from 'views/components/sidebar/community_selector';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ChatSection } from '../chat/chat_section';
import { CWButton } from '../component_kit/cw_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { ToggleTree } from './types';

function comparisonCustomizer(value1, value2) {
  if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
    return true;
  }
}
// Check that our current cached tree is structurally correct
export function verifyCachedToggleTree(
  treeName: string,
  toggleTree: ToggleTree
) {
  const cachedTree = JSON.parse(
    localStorage[`${app.activeChainId()}-${treeName}-toggle-tree`]
  );
  return _.isEqualWith(cachedTree, toggleTree, comparisonCustomizer);
}

type SidebarQuickSwitcherItemAttrs = {
  item: ChainInfo;
  size: number;
};

class SidebarQuickSwitcherItem
  implements m.ClassComponent<SidebarQuickSwitcherItemAttrs>
{
  view(vnode) {
    const { item, size } = vnode.attrs;

    return (
      <div class="SidebarQuickSwitcherItem" key={`chain-${item.id}`}>
        <div
          class={`quick-switcher-option ${
            item.id === app?.chain?.meta?.chain?.id
          }`}
        >
          <ChainIcon
            size={size}
            chain={item}
            onclick={link ? () => m.route.set(`/${item.id}`) : null}
          />
        </div>
      </div>
    );
  }
}

class SidebarQuickSwitcher implements m.ClassComponent {
  view() {
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) =>
        item instanceof ChainInfo
          ? app.config.nodes.getByChain(item.id)?.length > 0
          : true
      ); // only chains with nodes

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      if (
        item instanceof ChainInfo &&
        !app.communities.isStarred(item.id, null)
      )
        return false;
      return true;
    });

    const size = 36;

    return (
      <div class="SidebarQuickSwitcher">
        <div class="community-nav-bar">
          <Button
            class="sidebar-home-link"
            rounded={true}
            label={<Icon name={Icons.HOME} />}
            onclick={(e) => {
              e.preventDefault();
              m.route.set('/');
            }}
          />
          <CommunitySelector />
          {app.isLoggedIn() && (
            <Button
              class="create-community"
              rounded={true}
              label={<Icon name={Icons.PLUS} />}
              onclick={(e) => {
                e.preventDefault();
                m.route.set('/createCommunity');
              }}
            />
          )}
        </div>
        <div class="scrollable-community-bar">
          {starredCommunities.map((item) => (
            <SidebarQuickSwitcherItem item={item} size={size} />
          ))}
        </div>
      </div>
    );
  }
}

class ChainStatusModule implements m.ClassComponent {
  private initializing: boolean;

  oninit() {
    this.initializing = false;
  }

  view() {
    const url = app.chain?.meta?.url;
    if (!url) return;

    const formatUrl = (u) =>
      u
        .replace('ws://', '')
        .replace('wss://', '')
        .replace('http://', '')
        .replace('https://', '')
        .split('/')[0]
        .split(':')[0];

    const nodes = (
      app.chain && app.chain.meta
        ? []
        : [
            {
              name: 'node',
              label: 'Select a node',
              value: undefined,
              selected: true,
              chainId: undefined,
            },
          ]
    ).concat(
      app.config.nodes.getAll().map((n) => ({
        name: 'node',
        label: formatUrl(n.url),
        value: n.id,
        selected:
          app.chain &&
          app.chain.meta &&
          n.url === app.chain.meta.url &&
          n.chain === app.chain.meta.chain,
        chainId: n.chain.id,
      }))
    );

    return (
      <div class="ChainStatusModule">
        {app.chain.deferred ? (
          <CWButton
            buttonType="primary"
            label={this.initializing ? 'Connecting...' : 'Connect to chain'}
            disabled={this.initializing}
            onclick={async (e) => {
              e.preventDefault();
              this.initializing = true;
              await initChain();
              this.initializing = false;
              m.redraw();
            }}
          />
        ) : (
          <PopoverMenu
            transitionDuration={0}
            closeOnContentClick={true}
            closeOnOutsideClick={true}
            content={nodes
              .filter((node) => node.chainId === app.activeChainId())
              .map((node) => {
                return (
                  <MenuItem
                    label={[
                      node.label,
                      app.chain?.meta.id === node.value && ' (Selected)',
                    ]}
                    onclick={async (e) => {
                      e.preventDefault();
                      this.initializing = true;
                      const n: NodeInfo = app.config.nodes.getById(node.value);
                      if (!n) return;
                      const finalizeInitialization = await selectNode(n);
                      if (finalizeInitialization) await initChain();
                      this.initializing = false;
                      m.redraw();
                    }}
                  />
                );
              })}
            trigger={
              <Button
                // intent: ButtonIntent.Secondary,
                disabled={this.initializing}
                label={
                  this.initializing ? (
                    'Connecting...'
                  ) : app.chain.deferred ? (
                    'Connect to chain'
                  ) : (
                    <ChainStatusIndicator />
                  )
                }
              />
            }
          />
        )}
      </div>
    );
  }
}

export class ExternalLinksModule implements m.ClassComponent {
  view() {
    if (!app.chain) return;
    const meta = app.chain.meta.chain;
    const { website, discord, element, telegram, github } = meta;
    if (!website && !discord && !telegram && !github) return;

    // TODO Gabe 1/31/22 - The css here (and for the whole sidebar) needs to be extensively refactored,
    // I hacked together a short term fix for now (the hover color change is a little wonky)

    return (
      <div class="ExternalLinksModule.SidebarModule">
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

type SidebarAttrs = { useQuickSwitcher?: boolean };

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode) {
    const { useQuickSwitcher } = vnode.attrs;
    const isCustom = app.isCustomDomain();

    return (
      <div>
        {!isCustom && <SidebarQuickSwitcher />}
        {!useQuickSwitcher && app.chain && (
          <div class={`Sidebar ${isCustom ? 'custom-domain' : ''}`}>
            <DiscussionSection />
            <GovernanceSection />
            {app.socket && (
              <ChatSection
                channels={Object.values(app.socket.chatNs.channels)}
                activeChannel={m.route.param()['channel']}
              />
            )}
            <ExternalLinksModule />
            <br />
            {app.isLoggedIn() && app.chain && (
              <div class="subscription-button">
                <SubscriptionButton />
              </div>
            )}
            {app.chain && <ChainStatusModule />}
            {app.isCustomDomain() && (
              <a
                class="PoweredBy"
                onclick={() => {
                  window.open('https://commonwealth.im/');
                }}
              />
            )}
            <div class="spacer" />
          </div>
        )}
      </div>
    );
  }
}
