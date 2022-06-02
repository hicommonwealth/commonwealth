/* eslint-disable no-script-url */
import 'components/widgets/user.scss';

import m from 'mithril';
import { capitalize } from 'lodash';
import { link } from 'helpers';
import { Tag, Popover } from 'construct-ui';

import app from 'state';
import jdenticon from 'jdenticon';
import { ChainBase } from 'types';
import { Account, AddressInfo, Profile } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWPopover } from '../component_kit/cw_popover/cw_popover';

// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
export interface IAddressDisplayOptions {
  showFullAddress?: boolean;
  autoTruncate?: boolean;
  maxCharLength?: number;
}

const User: m.Component<
  {
    user: Account<any> | AddressInfo | Profile;
    avatarSize?: number;
    avatarOnly?: boolean; // overrides most other properties
    hideAvatar?: boolean;
    hideIdentityIcon?: boolean; // applies to substrate identities, also hides councillor icons
    showAddressWithDisplayName?: boolean; // show address inline with the display name
    addressDisplayOptions?: IAddressDisplayOptions; // display full or truncated address
    linkify?: boolean;
    onclick?: any;
    popover?: boolean;
    showRole?: boolean;
  },
  {
    identityWidgetLoading: boolean;
  }
> = {
  view: (vnode) => {
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
    const { showFullAddress, autoTruncate, maxCharLength } =
      vnode.attrs.addressDisplayOptions || {};
    const avatarSize = vnode.attrs.avatarSize || 16;
    const showAvatar = !hideAvatar;
    if (!user) return;

    let account: Account<any>;
    let profile: Profile; // profile is used to retrieve the chain and address later
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
      !vnode.state.identityWidgetLoading &&
      !app.cachedIdentityWidget
    ) {
      vnode.state.identityWidgetLoading = true;
      import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "substrate-identity-widget" */
        './substrate_identity'
      ).then((mod) => {
        app.cachedIdentityWidget = mod.default;
        vnode.state.identityWidgetLoading = false;
        m.redraw();
      });
    }

    if (vnode.attrs.user instanceof AddressInfo) {
      const chainId = vnode.attrs.user.chain;
      const address = vnode.attrs.user.address;
      if (!chainId || !address) return;
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === chainId) {
        try {
          account = app.chain.accounts.get(address);
        } catch (e) {
          console.log('legacy account error, carry on');
          account = null;
        }
      }
      profile = app.profiles.getProfile(chainId, address);
      role = adminsAndMods.find(
        (r) => r.address === address && r.address_chain === chainId
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
      const chainId =
        typeof account.chain === 'string' ? account.chain : account.chain.id;
      profile = account.profile;
      role = adminsAndMods.find(
        (r) => r.address === account.address && r.address_chain === chainId
      );
    }
    const getRoleTags = (long?) => [
      // 'long' makes role tags show as full length text
      profile.isCouncillor &&
        !hideIdentityIcon &&
        m(
          '.role-icon.role-icon-councillor',
          {
            class: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Councillor` : 'C'
        ),
      profile.isValidator &&
        !hideIdentityIcon &&
        m(
          '.role-icon.role-icon-validator',
          {
            class: long ? 'long' : '',
          },
          long ? `${friendlyChainName} Validator` : 'V'
        ),
      // offchain role in commonwealth forum
      showRole &&
        role &&
        m(Tag, {
          class: 'role-tag',
          label: role.permission,
          rounded: true,
          size: 'xs',
        }),
    ];
    const ghostAddress = app.user.addresses.some(
      ({ address, ghostAddress }) => {
        if (this !== undefined) account.address === address && ghostAddress;
      }
    );
    const userFinal = avatarOnly
      ? m(
          '.User.avatar-only',
          {
            key: profile?.address || '-',
          },
          [
            m(
              '.user-avatar-only',
              { style: `width: ${avatarSize}px; height: ${avatarSize}px;` },
              [
                !profile
                  ? null
                  : profile.avatarUrl
                  ? profile.getAvatar(avatarSize)
                  : profile.getAvatar(avatarSize - 4),
              ]
            ),
          ]
        )
      : m(
          '.User',
          {
            key: profile?.address || '-',
            class: linkify ? 'linkified' : '',
          },
          [
            showAvatar &&
              m(
                '.user-avatar',
                {
                  style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
                },
                profile && profile.getAvatar(avatarSize)
              ),
            app.chain &&
            app.chain.base === ChainBase.Substrate &&
            app.cachedIdentityWidget
              ? // substrate name
                m(app.cachedIdentityWidget, {
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
                                m(
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
                    : m('a.user-display-name.username', [
                        !profile
                          ? addrShort
                          : !showAddressWithDisplayName
                          ? profile.displayName
                          : [
                              profile.displayName,
                              m(
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
                    m('img', {
                      src: '/static/img/ghost.svg',
                      width: '20px',
                      style: 'display: inline-block',
                    }),
                ],
          ]
        );

    const userPopover = m(
      '.UserPopover',
      {
        onclick: (e) => {
          e.stopPropagation();
        },
      },
      [
        m('.user-avatar', [
          !profile
            ? null
            : profile.avatarUrl
            ? profile.getAvatar(36)
            : profile.getAvatar(32),
        ]),
        m('.user-name', [
          app.chain &&
          app.chain.base === ChainBase.Substrate &&
          app.cachedIdentityWidget
            ? m(app.cachedIdentityWidget, {
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
                      m(
                        '.id-short',
                        formatAddressShort(profile.address, profile.chain)
                      ),
                    ]
              ),
        ]),
        profile?.address &&
          m(
            '.user-address',
            formatAddressShort(
              profile.address,
              profile.chain,
              false,
              maxCharLength
            )
          ),
        friendlyChainName && m('.user-chain', friendlyChainName),
        getRoleTags(true), // always show roleTags in .UserPopover
      ]
    );

    return popover
      ? m(Popover, {
          inline: true,
          interactionType: 'hover',
          content: userPopover,
          trigger: userFinal,
          closeOnContentClick: true,
          transitionDuration: 0,
          hoverOpenDelay: 500,
          key: profile?.address || '-',
        })
      : userFinal;
  },
};

export const UserBlock: m.Component<{
  user: Account<any> | AddressInfo | Profile;
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
      hideOnchainRole,
      showAddressWithDisplayName,
      showChainName,
      selected,
      compact,
      linkify,
      addressDisplayOptions,
    } = vnode.attrs;

    const { showFullAddress, autoTruncate, maxCharLength } =
      vnode.attrs.addressDisplayOptions || {};

    let profile;
    if (user instanceof AddressInfo) {
      if (!user.chain || !user.address) return;
      profile = app.profiles.getProfile(user.chain, user.address);
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
          const isNear = profile.address.chain === 'near';
          const queryStart = profile.address.toLowerCase().indexOf(searchTerm);
          const queryEnd = queryStart + searchTerm.length;

          return [
            m('span', profile.address.slice(0, queryStart)),
            m('mark', profile.address.slice(queryStart, queryEnd)),
            m('span', profile.address.slice(queryEnd, profile.address.length)),
          ];
        })()
      : null;

    const children = [
      m('.user-block-left', [
        m(User, {
          user,
          avatarOnly: true,
          avatarSize: vnode.attrs.avatarSize || 28,
          popover,
        }),
      ]),
      m('.user-block-center', [
        m('.user-block-name', [
          m(User, {
            user,
            hideAvatar: true,
            hideIdentityIcon,
            showAddressWithDisplayName,
            addressDisplayOptions,
            popover,
            showRole,
          }),
        ]),
        m(
          '.user-block-address',
          {
            class: profile?.address ? '' : 'no-address',
          },
          [
            m(
              '',
              highlightSearchTerm
                ? highlightedAddress
                : showFullAddress
                ? profile.address
                : formatAddressShort(profile.address, profile.chain)
            ),
            profile?.address && showChainName && m('.address-divider', ' · '),
            showChainName &&
              m(
                '',
                typeof user.chain === 'string'
                  ? capitalize(user.chain)
                  : capitalize(user.chain.name)
              ),
          ]
        ),
      ]),
      m('.user-block-right', [
        m(
          '.user-block-selected',
          selected ? m(CWIcon, { iconName: 'check' }) : ''
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
      : m(
          '.UserBlock',
          {
            class: compact ? 'compact' : '',
          },
          children
        );
  },
};

export const AnonymousUser: m.Component<
  {
    avatarSize?: number;
    avatarOnly?: boolean;
    hideAvatar?: boolean;
    showAsDeleted?: boolean;
    distinguishingKey: string; // To distinguish user from other anonymous users
  },
  {}
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
      profileAvatar = m('svg.Jdenticon', {
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
      ? m(
          '.User.avatar-only',
          {
            key: '-',
          },
          [
            m(
              '.user-avatar-only',
              {
                style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
              },
              [profileAvatar]
            ),
          ]
        )
      : m(
          '.User',
          {
            key: '-',
          },
          [
            showAvatar &&
              m(
                '.user-avatar-only',
                {
                  style: `width: ${avatarSize}px; height: ${avatarSize}px;`,
                },
                [profileAvatar]
              ),
            [
              m(
                'a.user-display-name.username',
                showAsDeleted ? 'Deleted' : 'Anonymous'
              ),
            ],
          ]
        );
  },
};

export default User;
