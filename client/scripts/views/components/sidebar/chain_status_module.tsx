/* @jsx m */

import m from 'mithril';
import { Button, PopoverMenu, MenuItem } from 'construct-ui';

import 'components/sidebar/chain_status_module.scss';

import { selectNode, initChain } from 'app';
import app from 'state';
import { NodeInfo } from 'models';
import { ChainStatusIndicator } from 'views/components/chain_status_indicator';
import { CWButton } from '../component_kit/cw_button';

export class ChainStatusModule implements m.ClassComponent {
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
