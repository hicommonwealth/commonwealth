/* eslint-disable no-script-url */
import { ChainBase } from 'common-common/src/types';

import 'components/user/user.scss';

import { link } from 'helpers';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect } from 'react';

import app from 'state';
import { formatAddressShort } from '../../../../../shared/utils';
import AddressInfo from '../../../models/AddressInfo';
import MinimumProfile from '../../../models/MinimumProfile';
import { BanUserModal } from '../../modals/ban_user_modal';
import { CWButton } from '../component_kit/cw_button';
import { Modal } from '../component_kit/cw_modal';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { CWText } from '../component_kit/cw_text';

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
  linkify?: boolean;
  onclick?: any;
  popover?: boolean;
  showAddressWithDisplayName?: boolean; // show address inline with the display name
  showRole?: boolean;
  user: Account | AddressInfo | MinimumProfile;
};

export const User = (props: UserAttrs) => {
  // TODO: Fix showRole logic to fetch the role from chain
  const {
    avatarOnly,
    hideAvatar,
    showAddressWithDisplayName,
    user,
    linkify,
    popover,
    showRole,
  } = props;
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  useEffect(() => {
    app.newProfiles.isFetched.on('redraw', () => {
      forceRerender();
    });

    app.newProfiles.isFetched.off('redraw', () => {
      forceRerender();
    });
  }, []);

  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  const popoverProps = usePopover();

  const { maxCharLength } = props.addressDisplayOptions || {};

  const avatarSize = props.avatarSize || 16;

  const showAvatar = !hideAvatar;

  if (!user) return;

  let account: Account;

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

  if (props.user instanceof AddressInfo) {
    const chainId = props.user.chain;

    const address = props.user.address;

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

    profile = app.newProfiles.getProfile(chainId.id, address);

    role = adminsAndMods.find(
      (r) => r.address === address && r.address_chain === chainId.id
    );
  } else if (props.user instanceof MinimumProfile) {
    profile = props.user;

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
      (r) => r.address === profile.address && r.address_chain === profile.chain
    );
  } else {
    account = props.user;
    // TODO: we should remove this, since account should always be of type Account,
    // but we currently inject objects of type 'any' on the profile page
    const chainId = account.chain.id;

    profile = app.newProfiles.getProfile(chainId, account.address);

    role = adminsAndMods.find(
      (r) => r.address === account.address && r.address_chain === chainId
    );
  }

  const getRoleTags = (long?: boolean) => (
    <>
      {/* role in commonwealth forum */}
      {showRole && role && (
        <div className="role-tag-container">
          <CWText className="role-tag-text">{role.permission}</CWText>
        </div>
      )}
    </>
  );

  const userFinal = avatarOnly ? (
    <div className="User avatar-only" key={profile?.address || '-'}>
      {!profile
        ? null
        : profile.avatarUrl
        ? profile.getAvatar(avatarSize)
        : profile.getAvatar(avatarSize - 4)}
    </div>
  ) : (
    <div
      className={`User${linkify && profile?.id ? ' linkified' : ''}`}
      key={profile?.address || '-'}
    >
      {showAvatar && (
        <div
          className="user-avatar"
          style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
        >
          {profile && profile.getAvatar(avatarSize)}
        </div>
      )}
      {
        <>
          {/* non-substrate name */}
          {linkify && profile?.id ? (
            link(
              'a.user-display-name.username',
              profile ? `/profile/id/${profile.id}` : 'javascript:',
              <>
                {!profile ? (
                  addrShort
                ) : !showAddressWithDisplayName ? (
                  profile.name
                ) : (
                  <>
                    {profile.name}
                    <div className="id-short">
                      {formatAddressShort(profile.address, profile.chain)}
                    </div>
                  </>
                )}
                {getRoleTags(false)}
              </>,
              () => navigate(`/profile/id/${profile.id}`, {}, null)
            )
          ) : (
            <a className="user-display-name username">
              {!profile || !profile?.id ? (
                !profile?.id ? (
                  `${profile.address.slice(0, 8)}...${profile.address.slice(
                    -5
                  )}`
                ) : (
                  addrShort
                )
              ) : !showAddressWithDisplayName ? (
                profile.name
              ) : (
                <>
                  {profile.name}
                  <div className="id-short">
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
                style={{ display: 'inline-block' }}
              />
            )}
        </>
      }
    </div>
  );

  const userPopover = (
    <React.Fragment>
      <div
        className="UserPopover"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="user-avatar">
          {!profile
            ? null
            : profile.avatarUrl
            ? profile.getAvatar(36)
            : profile.getAvatar(32)}
        </div>
        <div className="user-name">
          {app.chain &&
            app.chain.base === ChainBase.Substrate &&
            link(
              'a.user-display-name',
              profile?.id ? `/profile/id/${profile.id}` : 'javascript:',
              !profile || !profile?.id ? (
                !profile?.id ? (
                  `${profile.address.slice(0, 8)}...${profile.address.slice(
                    -5
                  )}`
                ) : (
                  addrShort
                )
              ) : !showAddressWithDisplayName ? (
                profile.name
              ) : (
                <React.Fragment>
                  {profile.name}
                  <div className="id-short">
                    {formatAddressShort(profile.address, profile.chain)}
                  </div>
                </React.Fragment>
              ),
              () => navigate(`/profile/id/${profile.id}`, {}, null)
            )}
        </div>
        {profile?.address && (
          <div className="user-address">
            {formatAddressShort(
              profile.address,
              profile.chain,
              false,
              maxCharLength
            )}
          </div>
        )}
        {friendlyChainName && (
          <div className="user-chain">{friendlyChainName}</div>
        )}
        {/* always show roleTags in UserPopover */}
        {getRoleTags(true)}
        {/* If Admin Allow Banning */}
        {loggedInUserIsAdmin && (
          <div className="ban-wrapper">
            <CWButton
              onClick={() => {
                setIsModalOpen(true);
              }}
              label="Ban User"
              buttonType="primary-red"
            />
          </div>
        )}
      </div>
      <Modal
        content={
          <BanUserModal
            profile={profile}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </React.Fragment>
  );

  return popover ? (
    <div
      className="user-popover-wrapper"
      onMouseEnter={popoverProps.handleInteraction}
      onMouseLeave={popoverProps.handleInteraction}
    >
      {userFinal}
      <Popover content={userPopover} {...popoverProps} />
    </div>
  ) : (
    userFinal
  );
};
