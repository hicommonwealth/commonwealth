import 'components/login_with_wallet_dropdown.scss';

import m from 'mithril';
import $ from 'jquery';
import { Button, Input, Form, FormGroup, PopoverMenu, MenuItem, Icon, Icons } from 'construct-ui';

import app from 'state';
import { ChainBase } from 'models';
import { ChainIcon, CommunityIcon } from 'views/components/chain_icon';

const LoginWithWalletDropdown: m.Component<{
  label,
  loggingInWithAddress,
  joiningChain,
  joiningCommunity,
  successCallback?
}> = {
  view: (vnode) => {
    const { label, loggingInWithAddress, joiningChain, joiningCommunity, successCallback } = vnode.attrs;

    const prev = m.route.param('prev') ? m.route.param('prev') : m.route.get();
    const web3loginParams = loggingInWithAddress ? { prev, loggingInWithAddress } : joiningChain
      ? { prev, joiningChain } : joiningCommunity ? { prev, joiningCommunity } : { prev };

    return app.chain
      ? m(Button, {
        intent: 'primary',
        fluid: true,
        class: 'login-with-web3',
        label,
        onclick: (e) => {
          $(e.target).trigger('modalexit');
          m.route.set(`/${app.chain.id}/web3login`, web3loginParams);
          const redirectRoute = m.route.get();
          app.modals.lazyCreate('link_new_address_modal', {
            loggingInWithAddress,
            joiningChain,
            joiningCommunity,
            successCallback: () => {
              m.route.set(redirectRoute);
              if (successCallback) successCallback();
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
        content: app.config.chains.getAll().filter((chain) => {
          return app.config.nodes.getByChain(chain.id) && app.config.nodes.getByChain(chain.id).length > 0;
        }).sort((a, b) => {
          return a.name.localeCompare(b.name);
        }).map((chain) => {
          return m(MenuItem, {
            label: m('.chain-login-label', [
              m(ChainIcon, { chain, size: 20 }),
              m('.chain-login-label-name', chain.name),
            ]),
            onclick: (e) => {
              $('.Login').trigger('modalexit');
              m.route.set(`/${chain.id}/web3login`, web3loginParams)
              const redirectRoute = m.route.get();
              app.modals.lazyCreate('link_new_address_modal', {
                loggingInWithAddress,
                joiningChain,
                joiningCommunity,
                successCallback: () => {
                  m.route.set(redirectRoute);
                  if (successCallback) successCallback();
                }
              });
            }
          });
        }),
      });
  }
};

export default LoginWithWalletDropdown;
