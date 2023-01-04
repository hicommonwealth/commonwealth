import { Account, AddressInfo, Profile } from 'models';
import { ClassComponent, redraw, render, ResultNode } from 'mithrilInterop';
import app from 'state';
import { formatAddressShort } from 'utils';
import { ChainBase } from 'common-common/src/types';
import { link } from 'helpers';
import React from 'react';
import { IAddressDisplayOptions } from 'views/components/widgets/user';

interface UserProps {
  user: Account | AddressInfo | Profile;
  avatarSize?: number;
  avatarOnly?: boolean; // overrides most other properties
  hideAvatar?: boolean;
  hideIdentityIcon?: boolean; // applies to substrate identities, also hides councillor icons
  showAddressWithDisplayName?: boolean; // show address inline with the display name
  addressDisplayOptions?: IAddressDisplayOptions; // display full or truncated address
  linkify?: boolean;
  onClick?: any;
  popover?: boolean;
  showRole?: boolean;
}

class User extends ClassComponent<UserProps> {
  state = { identityWidgetLoading: false };
  view(vnode: ResultNode<UserProps>) {
    // TODO: Fix showRole logic to fetch the role from chain
    const {
      avatarOnly,
      hideAvatar,
      hideIdentityIcon,
      showAddressWithDisplayName,
      user,
      linkify,
      popover,
      showRole,
    } = vnode.attrs;

    const { maxCharLength } = vnode.attrs.addressDisplayOptions || {};

    const avatarSize = vnode.attrs.avatarSize || 16;

    const showAvatar = !hideAvatar;

    if (!user) return;

    let account: Account;
    let profile: Profile;
    const loggedInUserIsAdmin =
      app.user.isSiteAdmin ||
      app.roles.isAdminOfEntity({
        chain: app.activeChainId(),
      });
    let role;

    const addrShort = formatAddressShort(
      user.address,
      typeof user.chain === 'string' ? user.chain : user.chain?.id,
      false,
      maxCharLength
    );

    const friendlyChainName = app.config.chains.getById(
      typeof user.chain === 'string' ? user.chain : user.chain?.id
    )?.name;

    const adminsAndMods = app.chain?.meta.adminsAndMods || [];

    if (
      app.chain?.base === ChainBase.Substrate &&
      // !vnode.state.identityWidgetLoading &&
      !app.cachedIdentityWidget
    ) {
      // vnode.state.identityWidgetLoading = true;
      import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "substrate-identity-widget" */
        './substrate_identity'
      ).then((mod) => {
        app.cachedIdentityWidget = mod.default;
        // vnode.state.identityWidgetLoading = false;
        redraw();
      });
    }

    if (vnode.attrs.user instanceof AddressInfo) {
      const chainId = vnode.attrs.user.chain;
      const address = vnode.attrs.user.address;
      if (!chainId || !address) return;
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === chainId.id) {
        try {
          account = app.chain.accounts.get(address);
        } catch (e) {
          console.log('legacy account error, carry on');
          account = null;
        }
      }

      profile = app.profiles.getProfile(chainId.id, address);

      role = adminsAndMods.find(
        (r) => r.address === address && r.address_chain === chainId.id
      );
    } else if (vnode.attrs.user instanceof Profile) {
      profile = vnode.attrs.user;
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === profile.chain) {
        try {
          account = app.chain.accounts.get(profile.address);
        } catch (e) {
          console.error(e);
          account = null;
        }
      }
      role = adminsAndMods.find(
        (r) =>
          r.address === profile.address && r.address_chain === profile.chain
      );
    } else {
      account = vnode.attrs.user;
      // TODO: we should remove this, since account should always be of type Account,
      // but we currently inject objects of type 'any' on the profile page
      const chainId = account.chain.id;
      profile = account.profile;
      role = adminsAndMods.find(
        (r) => r.address === account.address && r.address_chain === chainId
      );
    }

    const getRoleTags = (long?) => [
      // 'long' makes role tags show as full length text
      profile.isCouncillor &&
        !hideIdentityIcon &&
        render(
          // '.role-icon.role-icon-councillor',
          'div',
          {
            className: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Councillor` : 'C'
        ),
      profile.isValidator &&
        !hideIdentityIcon &&
        render(
          // '.role-icon.role-icon-validator',
          'div',
          {
            className: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Validator` : 'V'
        ),
      // role in commonwealth forum
      // showRole &&
      //   role &&
      //   m(Tag, {
      //     class: 'role-tag',
      //     label: role.permission,
      //     rounded: true,
      //     size: 'xs',
      //   }),
    ];

    const ghostAddress = app.user.addresses.some(
      ({ address, ghostAddress }) => {
        if (this !== undefined) account.address === address && ghostAddress;
      }
    );

    const userFinal = avatarOnly
      ? render(
          // '.User.avatar-only',
          'div',
          {
            key: profile?.address || '-',
          },
          !profile
            ? null
            : profile.avatarUrl
            ? profile.getAvatar(avatarSize)
            : profile.getAvatar(avatarSize - 4)
        )
      : render(
          // '.User',
          'div',
          {
            key: profile?.address || '-',
            class: linkify ? 'linkified' : '',
          },
          [
            showAvatar &&
              render(
                'div',
                // '.user-avatar',
                {
                  // Error: The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX.
                  // style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
                },
                profile && profile.getAvatar(avatarSize)
              ),
            app.chain &&
            app.chain.base === ChainBase.Substrate &&
            app.cachedIdentityWidget
              ? // substrate name
                // render(app.cachedIdentityWidget, {
                //   account,
                //   linkify,
                //   profile,
                //   hideIdentityIcon,
                //   addrShort,
                //   showAddressWithDisplayName,
                // })
                render('div', {
                  account,
                  linkify,
                  profile,
                  hideIdentityIcon,
                  addrShort,
                  showAddressWithDisplayName,
                })
              : [
                  // non-substrate name
                  linkify
                    ? link(
                        // 'a.user-display-name.username',
                        'a',
                        profile
                          ? `/${app.activeChainId() || profile.chain}/account/${
                              profile.address
                            }?base=${profile.chain}`
                          : 'javascript:',
                        [
                          !profile
                            ? addrShort
                            : !showAddressWithDisplayName
                            ? profile.displayName
                            : [
                                profile.displayName,
                                render(
                                  'div',
                                  // '.id-short',
                                  formatAddressShort(
                                    profile.address,
                                    profile.chain
                                  )
                                ),
                              ],
                          getRoleTags(false),
                        ]
                      )
                    : render(
                        // 'a.user-display-name.username',
                        'div',
                        [
                          !profile
                            ? addrShort
                            : !showAddressWithDisplayName
                            ? profile.displayName
                            : [
                                profile.displayName,
                                render(
                                  'div',
                                  // '.id-short',
                                  formatAddressShort(
                                    profile.address,
                                    profile.chain
                                  )
                                ),
                              ],
                          getRoleTags(false),
                        ]
                      ),
                  ghostAddress &&
                    render('img', {
                      src: '/static/img/ghost.svg',
                      width: '20px',
                      // style: 'display: inline-block',
                    }),
                ],
          ]
        );

    // const userPopover = render(
    //   '.UserPopover',
    //   {
    //     onClick: (e) => {
    //       e.stopPropagation();
    //     },
    //   },
    //   [
    //     render('.user-avatar', [
    //       !profile
    //         ? null
    //         : profile.avatarUrl
    //         ? profile.getAvatar(36)
    //         : profile.getAvatar(32),
    //     ]),
    //     render('.user-name', [
    //       app.chain &&
    //       app.chain.base === ChainBase.Substrate &&
    //       app.cachedIdentityWidget
    //         ? render(app.cachedIdentityWidget, {
    //             account,
    //             linkify: true,
    //             profile,
    //             hideIdentityIcon,
    //             addrShort,
    //             showAddressWithDisplayName: false,
    //           })
    //         : link(
    //             'a.user-display-name',
    //             profile
    //               ? `/${app.activeChainId() || profile.chain}/account/${
    //                   profile.address
    //                 }?base=${profile.chain}`
    //               : 'javascript:',
    //             !profile
    //               ? addrShort
    //               : !showAddressWithDisplayName
    //               ? profile.displayName
    //               : [
    //                   profile.displayName,
    //                   render(
    //                     '.id-short',
    //                     formatAddressShort(profile.address, profile.chain)
    //                   ),
    //                 ]
    //           ),
    //     ]),
    //     profile?.address &&
    //       render(
    //         '.user-address',
    //         formatAddressShort(
    //           profile.address,
    //           profile.chain,
    //           false,
    //           maxCharLength
    //         )
    //       ),
    //     friendlyChainName && render('.user-chain', friendlyChainName),
    //     getRoleTags(true), // always show roleTags in .UserPopover
    //
    //     // If Admin Allow Banning
    //     loggedInUserIsAdmin &&
    //       render('.ban-wrapper', [
    //         render(CWButton, {
    //           onClick: () => {
    //             app.modals.create({
    //               modal: BanUserModal,
    //               data: { profile },
    //             });
    //           },
    //           label: 'Ban User',
    //           buttonType: 'primary-red',
    //         }),
    //       ]),
    //   ]
    // );

    return popover ? (
      <div>popover</div> // @TODO @REACT FIX ME
    ) : (
      // m(Popover, {
      //     interactionType: 'hover',
      //     content: userPopover,
      //     trigger: userFinal,
      //     closeOnContentClick: true,
      //     transitionDuration: 0,
      //     hoverOpenDelay: 500,
      //     key: profile?.address || '-',
      //   })
      userFinal
    );
  }
}

export default User;
