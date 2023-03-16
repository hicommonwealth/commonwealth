/* eslint-disable no-script-url */
import 'components/widgets/user.scss';
import { Popover, Tag } from 'construct-ui';
import { link } from 'helpers';
import jdenticon from 'jdenticon';
import { capitalize } from 'lodash';

import m from 'mithril';
import { MinimumProfile, AddressAccount } from 'models';

import app from 'state';
import { formatAddressShort } from '../../../../../shared/utils';
import { BanUserModal } from '../../modals/ban_user_modal';
import { CWButton } from '../component_kit/cw_button';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWAvatar } from '../component_kit/cw_avatar';

// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
export interface IAddressDisplayOptions {
  showFullAddress?: boolean;
  autoTruncate?: boolean;
  maxCharLength?: number;
}

const User: m.Component<
  {
    user: AddressAccount | MinimumProfile;
    avatarSize?: number;
    avatarOnly?: boolean; // overrides most other properties
    hideAvatar?: boolean;
    showAddressWithDisplayName?: boolean; // show address inline with the display name
    addressDisplayOptions?: IAddressDisplayOptions; // display full or truncated address
    linkify?: boolean;
    onclick?: any;
    popover?: boolean;
    showRole?: boolean;
  },
  {
    profileId: number;
  }
> = {
  view: (vnode) => {
    // TODO: Fix showRole logic to fetch the role from chain
    const {
      avatarOnly,
      hideAvatar,
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

    let addressAccount: AddressAccount;
    let profile: MinimumProfile;
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

    if (user instanceof AddressAccount) {
      if (!user.chain || !user.address) return;
      addressAccount = user;

      profile = app.newProfiles.getProfile(user.chain.id, user.address);

      role = adminsAndMods.find(
        (r) => r.address === user.address && r.address_chain === user.chain.id
      );
    } else if (vnode.attrs.user instanceof MinimumProfile) {
      profile = vnode.attrs.user;
      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === profile.chain) {
        try {
          addressAccount = app.chain.accounts.get(profile.address);
        } catch (e) {
          console.error(e);
          addressAccount = null;
        }
      }
      role = adminsAndMods.find(
        (r) =>
          r.address === profile.address && r.address_chain === profile.chain
      );
    }

    const getRoleTags = () => [
      // role in commonwealth forum
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
      // eslint-disable-next-line
      ({ address, ghostAddress }) => {
        if (this !== undefined)
          addressAccount.address === address && ghostAddress;
      }
    );

    const defaultAvatar = jdenticon.toSvg(profile.id, 90);
    const svgSource = `data:image/svg+xml;utf8,${encodeURIComponent(
      defaultAvatar
    )}`;

    const profileAvatar = profile?.avatarUrl
      ? m(CWAvatar, { avatarUrl: profile.avatarUrl, size: avatarSize })
      : m('img', { src: svgSource });

    const profileAvatarPopover = profile?.avatarUrl
      ? m(CWAvatar, { avatarUrl: profile.avatarUrl, size: avatarSize + 12 })
      : m('img', { src: svgSource });

    const userFinal = avatarOnly
      ? m(
          '.User.avatar-only',
          {
            key: profile?.address || '-',
          },
          !profile ? null : profileAvatar
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
                profile && profileAvatar
              ),
            [
              // non-substrate name
              linkify
                ? link(
                    'a.user-display-name.username',
                    profile ? `/profile/id/${profile.id}` : 'javascript:',
                    [
                      !profile
                        ? addrShort
                        : !showAddressWithDisplayName
                        ? profile.name
                        : [
                            profile.name,
                            m(
                              '.id-short',
                              formatAddressShort(profile.address, profile.chain)
                            ),
                          ],
                      getRoleTags(),
                    ]
                  )
                : m('a.user-display-name.username', [
                    !profile
                      ? addrShort
                      : !showAddressWithDisplayName
                      ? profile.name
                      : [
                          profile.name,
                          m(
                            '.id-short',
                            formatAddressShort(profile.address, profile.chain)
                          ),
                        ],
                    getRoleTags(),
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
        m('.user-avatar', [!profile ? null : profileAvatarPopover]),
        m('.user-name', [
          link(
            'a.user-display-name',
            profile ? `/profile/id/${profile.id}` : 'javascript:',
            !profile
              ? addrShort
              : !showAddressWithDisplayName
              ? profile.name
              : [
                  profile.name,
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
        // friendlyChainName && m('.user-chain', friendlyChainName),
        getRoleTags(), // always show roleTags in .UserPopover

        // If Admin Allow Banning
        loggedInUserIsAdmin &&
          m('.ban-wrapper', [
            m(CWButton, {
              onclick: () => {
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
      ? m(Popover, {
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

export const UserBlock: m.Component<
  {
    user: AddressAccount | MinimumProfile;
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
    hideAvatar?: boolean;
  },
  {
    profileId: number;
  }
> = {
  view: (vnode) => {
    const { user, searchTerm, showChainName, compact, linkify } = vnode.attrs;

    const chain = typeof user.chain === 'string' ? user.chain : user.chain?.id;

    const profile = app.newProfiles.getProfile(chain, user.address);

    const highlightSearchTerm =
      profile?.address &&
      searchTerm &&
      profile.address.toLowerCase().includes(searchTerm);

    const highlightedAddress = highlightSearchTerm
      ? (() => {
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
      m('.user-block-center', [
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
                : `${profile.address.slice(0, 8)}...${profile.address.slice(
                    -5
                  )}`
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
          m(CWIcon, { iconName: 'check', iconSize: 'small' })
        ),
      ]),
    ];

    const userLink = profile ? `/profile/id/${profile.id}` : 'javascript:';

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
