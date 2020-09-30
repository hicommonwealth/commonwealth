import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, PopoverMenu, MenuItem, MenuDivider, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

const CHAINS_WITH_CLI = ['edgeware', 'kulupu', 'kusama', 'cosmos'];

const LoginWithWalletDropdown: m.Component<{
  label,
  loggingInWithAddress,
  joiningChain,
  joiningCommunity,
}> = {
  view: (vnode) => {
    const { label, loggingInWithAddress, joiningChain, joiningCommunity } = vnode.attrs;

    const prev = m.route.param('prev') ? m.route.param('prev') : m.route.get();
    const next = (m.route.param('prev') && m.route.param('prev').indexOf('web3login') === -1) ? m.route.param('prev')
      : joiningChain ? `/${joiningChain}` : joiningCommunity ? `/${joiningCommunity}` : '/';
    const web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };

    const sortedChains = app.config.chains.getAll().filter((chain) => {
      return app.config.nodes.getByChain(chain.id) && app.config.nodes.getByChain(chain.id).length > 0;
    }).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    const sortedChainsWithCLI = sortedChains.filter((chain) => CHAINS_WITH_CLI.indexOf(chain.id) !== -1);

    const getMenuItemForChain = (chain, cli?: boolean) => m(MenuItem, {
      label: m('.chain-login-label', [
        m(ChainIcon, { chain, size: 20 }),
        m('.chain-login-label-name', [
          cli ? `${chain.name} (command line)` : chain.name
        ]),
      ]),
      onclick: (e) => {
        $('.Login').trigger('modalexit');
        m.route.set(`/${chain.id}/web3login`, web3loginParams);
        app.modals.lazyCreate('link_new_address_modal', {
          loggingInWithAddress,
          joiningChain,
          joiningCommunity,
          useCommandLineWallet: !!cli,
          successCallback: () => {
            m.route.set(next);
            m.redraw();
          }
        });
      }
    });
    const menuItems = sortedChains.map((chain) => getMenuItemForChain(chain))
      .concat(sortedChainsWithCLI.length > 0 ? m(MenuDivider) : null)
      .concat(sortedChainsWithCLI.map((chain) => getMenuItemForChain(chain, true)));

    return app.chain
      ? m(Button, {
        intent: 'primary',
        fluid: true,
        class: 'login-with-web3',
        label,
        onclick: (e) => {
          $(e.target).trigger('modalexit');
          m.route.set(`/${app.chain.id}/web3login`, web3loginParams);
          app.modals.lazyCreate('link_new_address_modal', {
            loggingInWithAddress,
            joiningChain,
            joiningCommunity,
            successCallback: () => {
              m.route.set(next);
              m.redraw();
            },
          });
        }
      })
      : m(PopoverMenu, {
        trigger: m(Button, {
          intent: 'primary',
          fluid: true,
          class: 'login-with-web3',
          label,
        }),
        addToStack: true,
        class: 'LoginWithWalletDropdownPopoverMenu',
        transitionDuration: 0,
        content: menuItems,
      });
  }
};

export default LoginWithWalletDropdown;
