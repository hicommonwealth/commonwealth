/* @jsx m */
/* eslint-disable no-script-url */

import ClassComponent from 'class_component';
import m from 'mithril';
import { link } from 'helpers';
import { Tag, Popover } from 'construct-ui';

import 'components/widgets/user.scss';

import app from 'state';
import { ChainBase } from 'common-common/src/types';
import { Account, AddressInfo, Profile } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWButton } from '../component_kit/cw_button';
import { BanUserModal } from '../../modals/ban_user_modal';

// Address can be shown in full, autotruncated with formatAddressShort(),
// or set to a custom max character length
export type AddressDisplayOptions = {
  autoTruncate?: boolean;
  maxCharLength?: number;
  showFullAddress?: boolean;
};

type UserAttrs = {
  addressDisplayOptions?: AddressDisplayOptions; // display full or truncated address
  avatarOnly?: boolean; // overrides most other properties
  avatarSize?: number;
  hideAvatar?: boolean;
  hideIdentityIcon?: boolean; // applies to substrate identities, also hides councillor icons
  linkify?: boolean;
  onclick?: any;
  popover?: boolean;
  showAddressWithDisplayName?: boolean; // show address inline with the display name
  showRole?: boolean;
  user: Account | AddressInfo | Profile;
};

export class User extends ClassComponent<UserAttrs> {
  private identityWidgetLoading: boolean;

  view(vnode: m.Vnode<UserAttrs>) {
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
        m.redraw();
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

    const getRoleTags = (long?: boolean) => (
      <>
        {/* 'long' makes role tags show as full length text */}
        {profile.isCouncillor && !hideIdentityIcon && (
          <div class={`role-icon role-icon-councillor${long ? ' long' : ''}`}>
            {long ? `${friendlyChainName} Councillor` : 'C'}
          </div>
        )}
        {profile.isValidator && !hideIdentityIcon && (
          <div class={`role-icon role-icon-validator${long ? ' long' : ''}`}>
            {long ? `${friendlyChainName} Validator` : 'V'}
          </div>
        )}
        {/* role in commonwealth forum */}
        {showRole &&
          role &&
          m(Tag, {
            class: 'role-tag',
            label: role.permission,
            rounded: true,
            size: 'xs',
          })}
      </>
    );

    const userFinal = avatarOnly ? (
      <div class="User avatar-only" key={profile?.address || '-'}>
        {!profile
          ? null
          : profile.avatarUrl
          ? profile.getAvatar(avatarSize)
          : profile.getAvatar(avatarSize - 4)}
      </div>
    ) : (
      <div
        class={`User${linkify ? ' linkified' : ''}`}
        key={profile?.address || '-'}
      >
        {showAvatar && (
          <div
            class="user-avatar"
            style={`width: ${avatarSize}px; height: ${avatarSize}px;`}
          >
            {profile && profile.getAvatar(avatarSize)}
          </div>
        )}
        {app.chain &&
        app.chain.base === ChainBase.Substrate &&
        app.cachedIdentityWidget ? (
          // substrate name
          m(app.cachedIdentityWidget, {
            account,
            linkify,
            profile,
            hideIdentityIcon,
            addrShort,
            showAddressWithDisplayName,
          })
        ) : (
          <>
            {/* non-substrate name */}
            {linkify ? (
              link(
                'a.user-display-name.username',
                profile
                  ? `/${app.activeChainId() || profile.chain}/account/${
                      profile.address
                    }?base=${profile.chain}`
                  : 'javascript:',
                [
                  !profile ? (
                    addrShort
                  ) : !showAddressWithDisplayName ? (
                    profile.displayName
                  ) : (
                    <>
                      {profile.displayName}
                      <div class="id-short">
                        {formatAddressShort(profile.address, profile.chain)}
                      </div>
                    </>
                  ),
                  getRoleTags(false),
                ]
              )
            ) : (
              <a class="user-display-name username">
                {!profile ? (
                  addrShort
                ) : !showAddressWithDisplayName ? (
                  profile.displayName
                ) : (
                  <>
                    {profile.displayName}
                    <div class="id-short">
                      {formatAddressShort(profile.address, profile.chain)}
                    </div>
                  </>
                )}
                {getRoleTags(false)}
              </a>
            )}
            {account &&
              app.user.addresses.some(
                ({ address, ghostAddress }) =>
                  account.address === address && ghostAddress
              ) && (
                <img
                  src="/static/img/ghost.svg"
                  width="20px"
                  style="display: inline-block"
                />
              )}
          </>
        )}
      </div>
    );

    const userPopover = (
      <div
        class="UserPopover"
        onclick={(e) => {
          e.stopPropagation();
        }}
      >
        <div class="user-avatar">
          {!profile
            ? null
            : profile.avatarUrl
            ? profile.getAvatar(36)
            : profile.getAvatar(32)}
        </div>
        <div class="user-name">
          {app.chain &&
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
                !profile ? (
                  addrShort
                ) : !showAddressWithDisplayName ? (
                  profile.displayName
                ) : (
                  <>
                    {profile.displayName}
                    <div class="id-short">
                      {formatAddressShort(profile.address, profile.chain)}
                    </div>
                  </>
                )
              )}
        </div>
        {profile?.address && (
          <div class="user-address">
            {formatAddressShort(
              profile.address,
              profile.chain,
              false,
              maxCharLength
            )}
          </div>
        )}
        {friendlyChainName && <div class="user-chain">{friendlyChainName}</div>}
        {/* always show roleTags in UserPopover */}
        {getRoleTags(true)}
        {/* If Admin Allow Banning */}
        {loggedInUserIsAdmin && (
          <div class="ban-wrapper">
            <CWButton
              onclick={() => {
                app.modals.create({
                  modal: BanUserModal,
                  data: { profile },
                });
              }}
              label="Ban User"
              buttonType="primary-red"
            />
          </div>
        )}
      </div>
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
  }
}
