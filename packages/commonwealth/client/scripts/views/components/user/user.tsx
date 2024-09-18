import { ChainBase, DEFAULT_NAME } from '@hicommonwealth/shared';
import ghostSvg from 'assets/img/ghost.svg';
import 'components/user/user.scss';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import useUserStore from 'state/ui/user';
import { Avatar } from 'views/components/Avatar';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import { formatAddressShort } from '../../../../../shared/utils';
import Permissions from '../../../utils/Permissions';
import { BanUserModal } from '../../modals/ban_user_modal';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWModal } from '../component_kit/new_designs/CWModal';
import { UserSkeleton } from './UserSkeleton';
import type { UserAttrsWithSkeletonProp } from './user.types';

// TODO: When this is no longer used, this should be removed in favour of fullUser.tsx
export const User = ({
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
  showSkeleton,
  popoverPlacement,
}: UserAttrsWithSkeletonProp) => {
  const popoverProps = usePopover();
  const loggedInUser = useUserStore();

  const { data: users } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId() || '',
    profileAddresses: [userAddress],
    profileChainIds: [userCommunityId],
    apiCallEnabled: !!(userAddress && userCommunityId),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: userCommunity, isLoading: isLoadingUserCommunity } =
    useGetCommunityByIdQuery({
      id: userCommunityId || '',
      enabled: !!userCommunityId,
    });

  if (showSkeleton || isLoadingUserCommunity) {
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

  const fullAddress = formatAddressShort(userAddress, userCommunityId);
  const redactedAddress = formatAddressShort(
    userAddress,
    userCommunityId,
    true,
    undefined,
    app.chain?.meta?.bech32_prefix || '',
  );
  const showAvatar = profile ? !shouldHideAvatar : false;
  const loggedInUserIsAdmin =
    Permissions.isSiteAdmin() || Permissions.isCommunityAdmin(userCommunity);
  const friendlyCommunityName = userCommunity?.name;
  const roleInCommunity = userCommunity?.adminsAndMods?.find(
    ({ address }) => address === userAddress,
  )?.role;
  const isGhostAddress = loggedInUser.addresses.some(
    ({ address, ghostAddress }) => userAddress === address && ghostAddress,
  );

  const roleTags = (
    <>
      {shouldShowRole && roleInCommunity && (
        <div className="role-tag-container">
          <CWText className="role-tag-text">{roleInCommunity}</CWText>
        </div>
      )}
    </>
  );

  const isSelfSelected = loggedInUser.addresses
    .map((a) => a.address)
    .includes(userAddress);

  const userBasisInfo = (
    <>
      {!profile ? (
        shouldShowAsDeleted ? (
          'Deleted'
        ) : (
          DEFAULT_NAME
        )
      ) : !profile?.userId ? (
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
        address={profile?.userId}
      />
    </div>
  ) : (
    <div
      className={`User${
        shouldLinkProfile && profile?.userId ? ' linkified' : ''
      }`}
      key={profile?.address || '-'}
    >
      {showAvatar && (
        <Link
          // @ts-expect-error <StrictNullChecks/>
          to={
            profile && shouldLinkProfile
              ? `/profile/id/${profile?.userId}`
              : undefined
          }
          className="user-avatar"
          style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
        >
          <Avatar
            url={profile?.avatarUrl}
            size={avatarSize}
            address={profile?.userId}
          />
        </Link>
      )}
      {
        <>
          {/* non-substrate name */}
          {shouldLinkProfile && profile?.userId ? (
            <Link
              className="user-display-name username"
              to={`/profile/id/${profile?.userId}`}
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
              src={ghostSvg}
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
              address={profile?.userId}
            />
          </div>
          <div className="user-name">
            {app.chain && app.chain.base === ChainBase.Substrate && (
              <Link
                className="user-display-name substrate@"
                // @ts-expect-error <StrictNullChecks/>
                to={
                  profile?.userId ? `/profile/id/${profile?.userId}` : undefined
                }
              >
                {!profile || !profile?.userId ? (
                  !profile?.userId && userAddress ? (
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
        zIndex={10001}
        content={
          <BanUserModal
            address={userAddress}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={(e) => {
          e.stopPropagation();
          setIsModalOpen(false);
        }}
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
