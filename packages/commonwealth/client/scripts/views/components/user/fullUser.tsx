import { ChainBase } from '@hicommonwealth/core';
import 'components/user/user.scss';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { Avatar } from 'views/components/Avatar';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { formatAddressShort } from '../../../../../shared/utils';
import Permissions from '../../../utils/Permissions';
import { BanUserModal } from '../../modals/ban_user_modal';
import { CWText } from '../component_kit/cw_text';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { UserSkeleton } from './UserSkeleton';
import { FullUserAttrsWithSkeletonProp } from './user.types';

// TODO: When we remove all usages of User component (user.tsx). We should rename this file and component to User
export const FullUser = ({
  shouldLinkProfile,
  shouldShowPopover,
  shouldShowRole,
  shouldShowAsDeleted = false,
  userAddress,
  userCommunityId,
  shouldHideAvatar,
  shouldShowAvatarOnly,
  shouldShowAddressWithDisplayName,
  avatarSize = 16,
  role,
  showSkeleton,
  popoverPlacement,
  profile,
}: FullUserAttrsWithSkeletonProp) => {
  const popoverProps = usePopover();
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

  const fullAddress = formatAddressShort(userAddress, userCommunityId);
  const redactedAddress = formatAddressShort(
    userAddress,
    userCommunityId,
    true,
    undefined,
    app.chain?.meta?.bech32Prefix,
  );
  const showAvatar = profile ? !shouldHideAvatar : false;
  const loggedInUserIsAdmin =
    Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const friendlyCommunityName =
    app.config.chains.getById(userCommunityId)?.name;
  const adminsAndMods = app.chain?.meta.adminsAndMods || [];
  const isGhostAddress = app.user.addresses.some(
    ({ address, ghostAddress }) => userAddress === address && ghostAddress,
  );
  const roleInCommunity =
    role ||
    adminsAndMods.find(
      (r) => r.address === userAddress && r.address_chain === userCommunityId,
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
      {!profile?.name ? (
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
          {profile?.address && (
            <div className="user-address">{redactedAddress}</div>
          )}
          {friendlyCommunityName && (
            <div className="user-chain">{friendlyCommunityName}</div>
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
                buttonType="destructive"
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
        <CWPopover
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
