/* @jsx m */
/* eslint-disable no-script-url */

import ClassComponent from 'class_component';
import m from 'mithril';
import { capitalize } from 'lodash';
import { link } from 'helpers';

import 'components/user/user.scss';

import app from 'state';
import { Account, AddressInfo, Profile } from 'models';
import { formatAddressShort } from '../../../../../shared/utils';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { User, AddressDisplayOptions } from './user';
import { getClasses } from '../component_kit/helpers';

export class UserBlock extends ClassComponent<{
  addressDisplayOptions?: AddressDisplayOptions;
  avatarSize?: number;
  compact?: boolean;
  hideIdentityIcon?: boolean;
  hideOnchainRole?: boolean;
  linkify?: boolean;
  popover?: boolean;
  searchTerm?: string;
  selected?: boolean;
  showAddressWithDisplayName?: boolean;
  showChainName?: boolean;
  showRole?: boolean;
  user: Account | AddressInfo | Profile;
}> {
  view(vnode) {
    const {
      addressDisplayOptions,
      compact,
      hideIdentityIcon,
      linkify,
      popover,
      searchTerm,
      selected,
      showAddressWithDisplayName,
      showChainName,
      showRole,
      user,
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

          return (
            <>
              <span>{profile.address.slice(0, queryStart)}</span>
              <mark>{profile.address.slice(queryStart, queryEnd)}</mark>
              <span>
                {profile.address.slice(queryEnd, profile.address.length)}
              </span>
            </>
          );
        })()
      : null;

    const children = (
      <>
        <div class="user-block-left">
          <User
            user={user}
            avatarOnly
            avatarSize={vnode.attrs.avatarSize || 28}
            popover={popover}
          />
        </div>
        <div class="user-block-center">
          <div class="user-block-name">
            <User
              user={user}
              hideAvatar
              hideIdentityIcon={hideIdentityIcon}
              showAddressWithDisplayName={showAddressWithDisplayName}
              addressDisplayOptions={addressDisplayOptions}
              popover={popover}
              showRole={showRole}
            />
          </div>
          <div
            class={`user-block-address${profile?.address ? '' : 'no-address'}`}
          >
            <div>
              {highlightSearchTerm
                ? highlightedAddress
                : showFullAddress
                ? profile.address
                : formatAddressShort(profile.address, profile.chain)}
            </div>
            {profile?.address && showChainName && (
              <div class="address-divider"> · </div>
            )}
            {showChainName && (
              <div>
                {typeof user.chain === 'string'
                  ? capitalize(user.chain)
                  : capitalize(user.chain.name)}
              </div>
            )}
          </div>
        </div>
        <div class="user-block-right">
          <div class="user-block-selected">
            {selected ? <CWIcon iconName="check" /> : ''}
          </div>
        </div>
      </>
    );

    const userLink = profile
      ? `/${app.activeChainId() || profile.chain}/account/${
          profile.address
        }?base=${profile.chain}`
      : 'javascript:';

    return linkify ? (
      link('.UserBlock', userLink, children)
    ) : (
      <div class={getClasses<{ compact?: boolean }>({ compact }, 'UserBlock')}>
        {children}
      </div>
    );
  }
}
