import { ChainBase } from 'common-common/src/types';
import 'components/user/user.scss';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import { Avatar } from 'views/components/Avatar';
import { formatAddressShort } from '../../../../../shared/utils';
import Permissions from '../../../utils/Permissions';
import { BanUserModal } from '../../modals/ban_user_modal';
import { CWButton } from '../component_kit/cw_button';
import { Popover, usePopover } from '../component_kit/cw_popover/cw_popover';
import { CWText } from '../component_kit/cw_text';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { UserSkeleton } from './UserSkeleton';
import type { UserAttrsWithSkeletonProp } from './user.types';

export const User = ({
  shouldLinkProfile,
  shouldShowPopover,
  shouldShowRole,
  shouldShowAsDeleted = false,
  userAddress,
  userChainId,
  shouldHideAvatar,
  shouldShowAvatarOnly,
  shouldShowAddressWithDisplayName,
  avatarSize = 16,
  role,
  showSkeleton,
  popoverPlacement,
}: UserAttrsWithSkeletonProp) => {
  const popoverProps = usePopover();
  const { data: users } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId(),
    profileAddresses: [userAddress],
    profileChainIds: [userChainId],
    apiCallEnabled: !!(userAddress && userChainId),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (showSkeleton) {
    return (
      <UserSkeleton
        shouldShowAvatarOnly={shouldShowAvatarOnly}
        shouldHideAvatar={shouldHideAvatar}
        shouldShowPopover={shouldShowPopover}
        avatarSize={avatarSize}
      />
    );
  }

  const profile = users?.[0] || {};

  const fullAddress = formatAddressShort(userAddress, userChainId);
  const redactedAddress = formatAddressShort(
    userAddress,
    userChainId,
    true,
    undefined,
    app.chain?.meta?.bech32Prefix,
  );

  const showAvatar = profile ? !shouldHideAvatar : false;
  const loggedInUserIsAdmin =
    Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const friendlyChainName = app.config.chains.getById(userChainId)?.name;
  const adminsAndMods = app.chain?.meta.adminsAndMods || [];
  const isGhostAddress = app.user.addresses.some(
    ({ address, ghostAddress }) => userAddress === address && ghostAddress,
  );
  const roleInCommunity =
    role ||
    adminsAndMods.find(
      (r) => r.address === userAddress && r.address_chain === userChainId,
    );

  const roleTags = (
    <>
      {shouldShowRole && roleInCommunity && (
        <div className="role-tag-container">
          <CWText className="role-tag-text">
            {roleInCommunity.permission}
          </CWText>
        </div>
      )}
    </>
  );

  const isSelfSelected = app.user.addresses
    .map((a) => a.address)
    .includes(userAddress);

  const userBasisInfo = (
    <>
      {!profile ? (
        shouldShowAsDeleted ? (
          'Deleted'
        ) : (
          'Anonymous'
        )
      ) : !profile?.id ? (
        redactedAddress
      ) : !shouldShowAddressWithDisplayName ? (
        profile?.name
      ) : (
        <>
          <div>{profile?.name}</div>
          <div className="id-short">{fullAddress}</div>
        </>
      )}
      {roleTags}
    </>
  );

  const userFinal = shouldShowAvatarOnly ? (
    <div className="User avatar-only" key={profile?.address || '-'}>
      <Avatar
        url={profile?.avatarUrl}
        size={profile?.avatarUrl ? avatarSize : avatarSize - 4}
        address={profile?.id}
      />
    </div>
  ) : (
    <div
      className={`User${shouldLinkProfile && profile?.id ? ' linkified' : ''}`}
      key={profile?.address || '-'}
    >
      {showAvatar && (
        <Link
          to={
            profile && shouldLinkProfile
              ? `/profile/id/${profile?.id}`
              : undefined
          }
          className="user-avatar"
          style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
        >
          <Avatar
            url={profile?.avatarUrl}
            size={avatarSize}
            address={profile?.id}
          />
        </Link>
      )}
      {
        <>
          {/* non-substrate name */}
          {shouldLinkProfile && profile?.id ? (
            <Link
              className="user-display-name username"
              to={`/profile/id/${profile?.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {userBasisInfo}
            </Link>
          ) : (
            <a className="user-display-name username">{userBasisInfo}</a>
          )}
          {isGhostAddress && (
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
        <div className="UserPopover" onClick={(e) => e.stopPropagation()}>
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
                to={profile?.id ? `/profile/id/${profile?.id}` : undefined}
              >
                {!profile || !profile?.id ? (
                  !profile?.id && userAddress ? (
                    `${userAddress.slice(0, 8)}...${userAddress.slice(-5)}`
                  ) : (
                    redactedAddress
                  )
                ) : !shouldShowAddressWithDisplayName ? (
                  profile?.name
                ) : (
                  <>
                    {profile?.name}
                    <div className="id-short">{redactedAddress}</div>
                  </>
                )}
              </Link>
            )}
          </div>
          <div className="user-address">
            {profile?.address ? redactedAddress : 'Address removed'}
          </div>
          {friendlyChainName && (
            <div className="user-chain">{friendlyChainName}</div>
          )}
          {roleTags}
          {/* If Admin Allow Banning */}
          {loggedInUserIsAdmin && !isSelfSelected && (
            <div className="ban-wrapper">
              <CWButton
                onClick={() => {
                  setIsModalOpen(true);
                }}
                label="Ban address"
                buttonType="primary-red"
              />
            </div>
          )}
        </div>
      )}
      <CWModal
        size="small"
        content={
          <BanUserModal
            address={userAddress}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );

  return shouldShowPopover ? (
    <div
      className="user-popover-wrapper"
      onMouseEnter={popoverProps.handleInteraction}
      onMouseLeave={popoverProps.handleInteraction}
    >
      {userFinal}
      {profile && (
        <Popover
          content={userPopover}
          {...popoverProps}
          placement={popoverPlacement}
        />
      )}
    </div>
  ) : (
    userFinal
  );
};
