import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import 'components/user/user.scss';

import app from 'state';
import { ChainBase } from 'common-common/src/types';
import { formatAddressShort } from '../../../../../shared/utils';
import type Account from '../../../models/Account';
import AddressInfo from '../../../models/AddressInfo';
import MinimumProfile from '../../../models/MinimumProfile';
import { CWButton } from '../component_kit/cw_button';
import { BanUserModal } from '../../modals/ban_user_modal';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { CWText } from '../component_kit/cw_text';
import { Modal } from '../component_kit/cw_modal';
import { useCommonNavigate } from 'navigation/helpers';
import useForceRerender from 'hooks/useForceRerender';
import { Avatar } from 'views/components/Avatar';
import Permissions from '../../../utils/Permissions';

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
  onClick?: (e: any) => void;
  popover?: boolean;
  showAddressWithDisplayName?: boolean; // show address inline with the display name
  showAsDeleted?: boolean;
  showRole?: boolean;
  user: Account | AddressInfo | MinimumProfile | undefined;
  role?: { permission: string };
};

export const User = ({
  avatarOnly,
  hideAvatar,
  showAddressWithDisplayName,
  user,
  linkify,
  onClick,
  popover,
  showRole,
  showAsDeleted = false,
  addressDisplayOptions,
  avatarSize: size,
  role,
}: UserAttrs) => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  useEffect(() => {
    app.newProfiles.isFetched.on('redraw', () => {
      forceRerender();
    });

    app.newProfiles.isFetched.off('redraw', () => {
      forceRerender();
    });
  }, [forceRerender]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const popoverProps = usePopover();

  const { maxCharLength } = addressDisplayOptions || {};

  const avatarSize = size || 16;

  const showAvatar = user ? !hideAvatar : false;

  let account: Account;
  let profile: MinimumProfile;
  let addrShort: string;
  let loggedInUserIsAdmin = false;
  let friendlyChainName: string | undefined;
  let adminsAndMods = [];

  if (user) {
    loggedInUserIsAdmin =
      Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

    addrShort = formatAddressShort(
      user.address,
      typeof user.chain === 'string' ? user.chain : user.chain?.id,
      false,
      maxCharLength
    );

    friendlyChainName = app.config.chains.getById(
      typeof user.chain === 'string' ? user.chain : user.chain?.id
    )?.name;

    adminsAndMods = app.chain?.meta.adminsAndMods || [];

    if (user instanceof AddressInfo) {
      const chainId = user.chain;

      const address = user.address;

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

      if (!role) {
        role = adminsAndMods.find(
          (r) => r.address === address && r.address_chain === chainId.id
        );
      }
    } else if (user instanceof MinimumProfile) {
      profile = user;

      // only load account if it's possible to, using the current chain
      if (app.chain && app.chain.id === profile.chain) {
        try {
          account = app.chain.accounts.get(profile.address);
        } catch (e) {
          console.error(e);
          account = null;
        }
      }

      if (!role) {
        role = adminsAndMods.find(
          (r) =>
            r.address === profile.address && r.address_chain === profile.chain
        );
      }
    } else {
      account = user;
      // TODO: we should remove this, since account should always be of type Account,
      // but we currently inject objects of type 'any' on the profile page
      const chainId = account.chain.id;

      profile = app.newProfiles.getProfile(chainId, account.address);

      if (!role) {
        role = adminsAndMods.find(
          (r) => r.address === account.address && r.address_chain === chainId
        );
      }
    }
  }

  const getRoleTags = () => (
    <>
      {/* role in commonwealth forum */}
      {showRole && role && (
        <div className="role-tag-container">
          <CWText className="role-tag-text">{role.permission}</CWText>
        </div>
      )}
    </>
  );

  const handleClick = (e: any) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/profile/id/${profile.id}`, {}, null);
    }
  };

  const userFinal = avatarOnly ? (
    <div className="User avatar-only" key={profile?.address || '-'}>
      <Avatar
        url={profile?.avatarUrl}
        size={profile?.avatarUrl ? avatarSize : avatarSize - 4}
        address={profile?.id}
      />
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
          <Avatar
            url={profile?.avatarUrl}
            size={avatarSize}
            address={profile?.id}
          />
        </div>
      )}
      {
        <>
          {/* non-substrate name */}
          {linkify && profile?.id ? (
            <Link
              className="user-display-name username"
              to={profile ? `/profile/id/${profile.id}` : undefined}
            >
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
                {getRoleTags()}
              </>
            </Link>
          ) : (
            <a className="user-display-name username">
              {!profile ? (
                showAsDeleted ? (
                  'Deleted'
                ) : (
                  'Anonymous'
                )
              ) : !profile.id ? (
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

              {getRoleTags()}
            </a>
          )}
          {account &&
            app.user.addresses.some(
              ({ address, ghostAddress }) =>
                account.address === address && ghostAddress
            ) && (
              <img
                alt="ghost"
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
    <>
      {profile && (
        <div
          className="UserPopover"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="user-avatar">
            <Avatar
              url={profile?.avatarUrl}
              size={profile?.avatarUrl ? 36 : 32}
              address={profile?.id}
            />
          </div>
          <div className="user-name">
            {app.chain && app.chain.base === ChainBase.Substrate && (
              <Link
                className="user-display-name substrate@"
                to={profile?.id ? `/profile/id/${profile.id}` : undefined}
              >
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
              </Link>
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
          {getRoleTags()}
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
      )}
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
    </>
  );

  return popover ? (
    <div
      className="user-popover-wrapper"
      onMouseEnter={popoverProps.handleInteraction}
      onMouseLeave={popoverProps.handleInteraction}
    >
      {userFinal}
      {user && <Popover content={userPopover} {...popoverProps} />}
    </div>
  ) : (
    userFinal
  );
};
