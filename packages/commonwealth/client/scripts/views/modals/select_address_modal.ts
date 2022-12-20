/* eslint-disable @typescript-eslint/ban-types */
import 'modals/select_address_modal.scss';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';
import $ from 'jquery';
import { Tag, Button } from 'construct-ui';

import app from 'state';
import { ChainBase, ChainNetwork, WalletId } from 'common-common/src/types';
import { Account, RoleInfo } from 'models';
import { UserBlock } from 'views/components/widgets/user';
import { isSameAccount, formatAsTitleCase } from 'helpers';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { setActiveAccount } from 'controllers/app/login';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { formatAddressShort } from '../../../../shared/utils';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

const SelectAddressModal: Component<
  {},
  { selectedIndex: number; loading: boolean }
> = {
  view: (vnode) => {
    const activeAccountsByRole: Array<[Account, RoleInfo]> =
      app.roles.getActiveAccountsByRole();
    const activeEntityInfo = app.chain?.meta;
    const createRole = (e) => {
      vnode.state.loading = true;

      const [account, role] = activeAccountsByRole[vnode.state.selectedIndex];
      const addressInfo = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );
      app.roles
        .createRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          vnode.state.loading = false;
          redraw();
          vnode.state.selectedIndex = null;
          // select the address, and close the form
          notifySuccess(
            `Joined with ${formatAddressShort(
              addressInfo.address,
              addressInfo.chain.id,
              true
            )}`
          );
          setActiveAccount(account).then(() => {
            redraw();
            $(e.target).trigger('modalexit');
          });
        })
        .catch((err: any) => {
          vnode.state.loading = false;
          redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const deleteRole = async (index, e) => {
      vnode.state.loading = true;
      const [account, role] = activeAccountsByRole[index];
      const addressInfo = app.user.addresses.find(
        (a) => a.address === account.address && a.chain.id === account.chain.id
      );

      // confirm
      const confirmed = await confirmationModalWithText(
        'Remove this address from the community?'
      )();
      if (!confirmed) {
        vnode.state.loading = false;
        redraw();
        return;
      }

      app.roles
        .deleteRole({
          address: addressInfo,
          chain: app.activeChainId(),
        })
        .then(() => {
          vnode.state.loading = false;
          redraw();
          vnode.state.selectedIndex = null;
          // unset activeAccount, or set it to the next activeAccount
          if (isSameAccount(app.user.activeAccount, account)) {
            app.user.ephemerallySetActiveAccount(null);
          }
        })
        .catch((err: any) => {
          vnode.state.loading = false;
          redraw();
          notifyError(err.responseJSON.error);
        });
    };

    const chainbase = app.chain ? app.chain?.meta?.base : ChainBase.Ethereum;

    const activeCommunityMeta = app.chain.meta;
    const hasTermsOfService = !!activeCommunityMeta?.terms;

    return render('.SelectAddressModal', [
      render('.compact-modal-title', [render('h3', 'Manage addresses')]),
      render('.compact-modal-body', [
        activeAccountsByRole.length === 0
          ? render('.select-address-placeholder', [
              render('p', [
                `Connect ${
                  chainbase && app.chain.network === ChainNetwork.Terra
                    ? 'Terra'
                    : chainbase
                    ? chainbase[0].toUpperCase() + chainbase.slice(1)
                    : 'Web3'
                } address to join this community: `,
              ]),
            ])
          : render('.select-address-options', [
              activeAccountsByRole.map(
                ([account, role], index) =>
                  role &&
                  render('.select-address-option.existing', [
                    render('.select-address-option-left', [
                      render(UserBlock, { user: account }),
                      app.user.addresses.find(
                        (a) =>
                          a.address === account.address &&
                          a.chain.id === account.chain.id
                      )?.walletId === WalletId.Magic &&
                        render(
                          '.magic-label',
                          `Magically linked to ${app.user.email}`
                        ),
                    ]),
                    render('.role-remove', [
                      render(
                        'span.already-connected',
                        `${formatAsTitleCase(role.permission)} of '${
                          activeEntityInfo?.name
                        }'`
                      ),
                      render(CWIcon, {
                        iconName: 'close',
                        iconSize: 'small',
                        onclick: deleteRole.bind(this, index),
                      }),
                    ]),
                  ])
              ),
              activeAccountsByRole.map(
                ([account, role], index) =>
                  !role &&
                  render(
                    '.select-address-option',
                    {
                      class:
                        vnode.state.selectedIndex === index ? 'selected' : '',
                      onclick: async (e) => {
                        e.preventDefault();
                        vnode.state.selectedIndex = index;
                      },
                    },
                    [
                      render('.select-address-option-left', [
                        render(UserBlock, {
                          user: account,
                          showRole: true,
                          selected: vnode.state.selectedIndex === index,
                        }),
                        app.user.addresses.find(
                          (a) =>
                            a.address === account.address &&
                            a.chain.id === account.chain.id
                        )?.walletId === WalletId.Magic &&
                          render(
                            '.magic-label',
                            `Magically linked to ${app.user.email}`
                          ),
                      ]),
                      role &&
                        render('.role-permission', [
                          render(Tag, {
                            label: formatAsTitleCase(role.permission),
                            rounded: true,
                            size: 'sm',
                          }),
                          role.is_user_default &&
                            render(Tag, {
                              label: 'Last used',
                              rounded: true,
                              size: 'sm',
                            }),
                        ]),
                    ]
                  )
              ),
            ]),
        hasTermsOfService &&
          render('p.terms-of-service', [
            `By linking an address, you agree to ${activeCommunityMeta.name}'s `,
            render(
              'a',
              { href: activeCommunityMeta.terms, target: '_blank' },
              'terms of service'
            ),
            '.',
          ]),
        activeAccountsByRole.length !== 0 &&
          render(Button, {
            label: 'Join community with address',
            intent: 'primary',
            compact: true,
            fluid: true,
            rounded: true,
            disabled:
              typeof vnode.state.selectedIndex !== 'number' ||
              vnode.state.loading,
            onclick: createRole.bind(this),
          }),
        // render(LoginWithWalletDropdown, {
        //   loggingInWithAddress: false,
        //   joiningChain: app.activeChainId(),
        //   label:
        //     activeAccountsByRole.length !== 0
        //       ? 'Connect a new address'
        //       : 'Connect address',
        //   onSuccess: () => {
        //     $('.SelectAddressModal').trigger('modalexit');
        //     notifySuccess('New address connected!');
        //   },
        // }),
      ]),
    ]);
  },
};

export default SelectAddressModal;
