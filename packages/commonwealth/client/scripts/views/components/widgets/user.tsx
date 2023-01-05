/* eslint-disable no-script-url */
import 'components/widgets/user.scss';
import React from 'react';

import { capitalize } from 'lodash';
import { link } from 'helpers';
import { ClassComponent, render, redraw, Component } from 'mithrilInterop';

import app from 'state';
import jdenticon from 'jdenticon';
import { ChainBase } from 'common-common/src/types';
import { Account, AddressInfo, Profile } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWButton } from '../component_kit/cw_button';
import { BanUserModal } from '../../modals/ban_user_modal';

// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
export interface IAddressDisplayOptions {
  showFullAddress?: boolean;
  autoTruncate?: boolean;
  maxCharLength?: number;
}

/* @FIXME @REACT need to refactor this state */
class User extends ClassComponent<
  {
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
> {
  private identityWidgetLoading = false;
  view(vnode) {
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
      !this.identityWidgetLoading &&
      !app.cachedIdentityWidget
    ) {
      this.identityWidgetLoading = true;
      import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "substrate-identity-widget" */
        './substrate_identity'
      ).then((mod) => {
        app.cachedIdentityWidget = mod.default;
        this.identityWidgetLoading = false;
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
          // todo this is not valid for react.createElement
          '.role-icon.role-icon-councillor',
          {
            className: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Councillor` : 'C'
        ),
      profile.isValidator &&
        !hideIdentityIcon &&
        render(
          '.role-icon.role-icon-validator',
          {
            className: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Validator` : 'V'
        ),
      // role in commonwealth forum
      // showRole &&
      //   role &&
      //   m(Tag, {
      //     className: 'role-tag',
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
          '.User.avatar-only',
          {
            key: profile?.address || '-',
          },
          !profile
            ? []
            : profile.avatarUrl
            ? profile.getAvatar(avatarSize)
            : profile.getAvatar(avatarSize - 4)
        )
      : render(
          '.User',
          {
            key: profile?.address || '-',
            className: linkify ? 'linkified' : '',
          },
          [
            showAvatar &&
              render(
                '.user-avatar',
                {
                  key: profile?.address || '-',
                  STYLE: `width: ${avatarSize}px; height: ${avatarSize}px;`,
                },
                [ profile && profile.getAvatar(avatarSize) ]
              ),
            app.chain &&
            app.chain.base === ChainBase.Substrate &&
            app.cachedIdentityWidget
              ? // substrate name
                render(app.cachedIdentityWidget, {
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
                        'a.user-display-name.username',
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
                                  '.id-short',
                                  formatAddressShort(
                                    profile.address,
                                    profile.chain
                                  )
                                ),
                              ],
                          getRoleTags(false),
                        ]
                      )
                    : render('a.user-display-name.username', [
                        !profile
                          ? addrShort
                          : !showAddressWithDisplayName
                          ? profile.displayName
                          : [
                              profile.displayName,
                              render(
                                '.id-short',
                                formatAddressShort(
                                  profile.address,
                                  profile.chain
                                )
                              ),
                            ],
                        getRoleTags(false),
                      ]),
                  ghostAddress &&
                    render('img', {
                      src: '/static/img/ghost.svg',
                      width: '20px',
                      style: 'display: inline-block',
                    }),
                ],
          ]
        );

    const userPopover = render(
      '.UserPopover',
      {
        onClick: (e) => {
          e.stopPropagation();
        },
      },
      [
        render('.user-avatar', [
          !profile
            ? null
            : profile.avatarUrl
            ? profile.getAvatar(36)
            : profile.getAvatar(32),
        ]),
        render('.user-name', [
          app.chain &&
          app.chain.base === ChainBase.Substrate &&
          app.cachedIdentityWidget
            ? render(app.cachedIdentityWidget, {
                account,
                linkify: true,
                profile,
                hideIdentityIcon,
                addrShort,
                showAddressWithDisplayName: false,
              })
            : link(
                'a.user-display-name',
                profile
                  ? `/${app.activeChainId() || profile.chain}/account/${
                      profile.address
                    }?base=${profile.chain}`
                  : 'javascript:',
                !profile
                  ? addrShort
                  : !showAddressWithDisplayName
                  ? profile.displayName
                  : [
                      profile.displayName,
                      render(
                        '.id-short',
                        formatAddressShort(profile.address, profile.chain)
                      ),
                    ]
              ),
        ]),
        profile?.address &&
          render(
            '.user-address',
            formatAddressShort(
              profile.address,
              profile.chain,
              false,
              maxCharLength
            )
          ),
        friendlyChainName && render('.user-chain', friendlyChainName),
        getRoleTags(true), // always show roleTags in .UserPopover

        // If Admin Allow Banning
        loggedInUserIsAdmin &&
          render('.ban-wrapper', [
            render(CWButton, {
              onClick: () => {
                app.modals.create({
                  modal: BanUserModal,
                  data: { profile },
                });
              },
              label: 'Ban User',
              buttonType: 'primary-red',
            }),
          ]),
      ]
    );

    return popover
      ? null // @TODO @REACT FIX ME
      // m(Popover, {
      //     interactionType: 'hover',
      //     content: userPopover,
      //     trigger: userFinal,
      //     closeOnContentClick: true,
      //     transitionDuration: 0,
      //     hoverOpenDelay: 500,
      //     key: profile?.address || '-',
      //   })
      : userFinal;
  }
}

export const UserBlock: Component<{
  user: Account | AddressInfo | Profile;
  hideIdentityIcon?: boolean;
  popover?: boolean;
  showRole?: boolean;
  showAddressWithDisplayName?: boolean;
  addressDisplayOptions?: IAddressDisplayOptions;
  searchTerm?: string;
  showChainName?: boolean;
  hideOnchainRole?: boolean;
  selected?: boolean;
  compact?: boolean;
  linkify?: boolean;
  avatarSize?: number;
}> = {
  view: (vnode) => {
    const {
      user,
      hideIdentityIcon,
      popover,
      showRole,
      searchTerm,
      showAddressWithDisplayName,
      showChainName,
      selected,
      compact,
      linkify,
      addressDisplayOptions,
    } = vnode.attrs;

    const { showFullAddress } = vnode.attrs.addressDisplayOptions || {};

    let profile;

    if (user instanceof AddressInfo) {
      if (!user.chain || !user.address) return;
      profile = app.profiles.getProfile(user.chain.id, user.address);
    } else if (user instanceof Profile) {
      profile = user;
    } else {
      profile = app.profiles.getProfile(user.chain.id, user.address);
    }

    const highlightSearchTerm =
      profile?.address &&
      searchTerm &&
      profile.address.toLowerCase().includes(searchTerm);

    const highlightedAddress = highlightSearchTerm
      ? (() => {
          const queryStart = profile.address.toLowerCase().indexOf(searchTerm);
          const queryEnd = queryStart + searchTerm.length;

          return [
            render('span', profile.address.slice(0, queryStart)),
            render('mark', profile.address.slice(queryStart, queryEnd)),
            render('span', profile.address.slice(queryEnd, profile.address.length)),
          ];
        })()
      : null;

    const children = [
      render('.user-block-left', [
        render(User, {
          user,
          avatarOnly: true,
          avatarSize: vnode.attrs.avatarSize || 28,
          popover,
        }),
      ]),
      render('.user-block-center', [
        render('.user-block-name', [
          render(User, {
            user,
            hideAvatar: true,
            hideIdentityIcon,
            showAddressWithDisplayName,
            addressDisplayOptions,
            popover,
            showRole,
          }),
        ]),
        render(
          '.user-block-address',
          {
            className: profile?.address ? '' : 'no-address',
          },
          [
            render(
              '',
              highlightSearchTerm
                ? highlightedAddress
                : showFullAddress
                ? profile.address
                : formatAddressShort(profile.address, profile.chain)
            ),
            profile?.address && showChainName && render('.address-divider', ' · '),
            showChainName &&
              render(
                '',
                typeof user.chain === 'string'
                  ? capitalize(user.chain)
                  : capitalize(user.chain.name)
              ),
          ]
        ),
      ]),
      render('.user-block-right', [
        render(
          '.user-block-selected',
          selected ? render(CWIcon, { iconName: 'check' }) : ''
        ),
      ]),
    ];

    const userLink = profile
      ? `/${app.activeChainId() || profile.chain}/account/${
          profile.address
        }?base=${profile.chain}`
      : 'javascript:';

    return linkify
      ? link('.UserBlock', userLink, children)
      : render(
          '.UserBlock',
          {
            className: compact ? 'compact' : '',
          },
          children
        );
  },
};

export const AnonymousUser: Component<
  {
    avatarSize?: number;
    avatarOnly?: boolean;
    hideAvatar?: boolean;
    showAsDeleted?: boolean;
    distinguishingKey: string; // To distinguish user from other anonymous users
  }
> = {
  view: (vnode) => {
    const {
      avatarOnly,
      avatarSize,
      hideAvatar,
      distinguishingKey,
      showAsDeleted,
    } = vnode.attrs;

    const showAvatar = !hideAvatar;

    let profileAvatar;

    if (showAvatar) {
      const pseudoAddress = distinguishingKey;

      profileAvatar = render('svg.Jdenticon', {
        style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
        'data-address': pseudoAddress,
        oncreate: (vnode_) => {
          jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
        },
        onupdate: (vnode_) => {
          jdenticon.update(vnode_.dom as HTMLElement, pseudoAddress);
        },
      });
    }

    return avatarOnly
      ? render(
          '.User.avatar-only',
          {
            key: '-',
          },
          [
            render(
              '.user-avatar-only',
              {
                style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
              },
              [profileAvatar]
            ),
          ]
        )
      : render(
          '.User',
          {
            key: '-',
          },
          [
            showAvatar &&
              render(
                '.user-avatar-only',
                {
                  style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
                },
                [profileAvatar]
              ),
            [
              render(
                'a.user-display-name.username',
                showAsDeleted ? 'Deleted' : 'Anonymous'
              ),
            ],
          ]
        );
  },
};

export default User;
