import { USER_TIERS, UserTierMap } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import { useFetchProfileByIdQuery } from 'state/api/profiles';
import useSetUserTierMutation from 'state/api/superAdmin/setUserTier';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const getTierLabel = (tier: UserTierMap) => {
  const tierInfo = USER_TIERS[tier];
  let label = ``;
  if ('clientInfo' in tierInfo) {
    label = `${tierInfo.clientInfo?.icon} ${tierInfo.name}`;
  } else {
    label = tierInfo.name;
  }
  label += ` (${tierInfo.description})`;
  return label;
};

const userTierOptions = Object.keys(USER_TIERS)
  .filter(
    (t) =>
      ![UserTierMap.SystemUser, UserTierMap.IncompleteUser].includes(
        parseInt(t),
      ),
  )
  .map((key) => ({
    value: key,
    label: getTierLabel(parseInt(key) as UserTierMap),
  }));

const UserTier = () => {
  const [userId, setUserId] = useState<number | undefined>();
  const debouncedUserId = useDebounce<number | undefined>(userId, 500);
  const { data: user, isLoading: isLoadingUser } = useFetchProfileByIdQuery({
    userId: debouncedUserId,
    apiCallEnabled: !!debouncedUserId,
  });

  const [selectedUserTier, setSelectedUserTier] = useState<UserTierMap>(
    UserTierMap.IncompleteUser,
  );

  const { mutateAsync: setUserTier, isPending } = useSetUserTierMutation();

  useEffect(() => {
    if (user) {
      setSelectedUserTier(user.tier);
    }
  }, [user]);

  const userNotFound = !isLoadingUser && !!debouncedUserId && !user;

  // Find the current option based on the selected tier
  const selectedOption = userTierOptions.find(
    (option) => +option.value === selectedUserTier,
  );

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update User Tier',
      description:
        'Are you sure you want to update the tier for ' +
        `${userId}${user?.profile?.name ? ` (${user.profile.name})` : ''} to ${selectedOption?.label || ''}?`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: () => {
            setUserTier({
              user_id: userId!,
              tier: selectedUserTier,
            })
              .then(() => {
                notifySuccess('User tier updated');
              })
              .catch((e) => {
                notifyError('Error updating user tier');
                console.error(e);
              });
          },
        },
        {
          label: 'Cancel',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
      ],
    });
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Update User Tier</CWText>
      <CWText type="caption">Updates a user&apos;s tier.</CWText>
      <div className="TaskRow">
        <CWTextInput
          value={userId}
          onInput={(e) =>
            setUserId(parseInt(e?.target?.value?.trim()) || undefined)
          }
          customError={userNotFound ? 'User not found' : ''}
          placeholder="User id"
          fullWidth
        />
        <CWSelectList
          value={selectedOption}
          options={userTierOptions}
          onChange={(item) => {
            item && setSelectedUserTier(+item.value);
          }}
          isSearchable={false}
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={
            isLoadingUser || userNotFound || !debouncedUserId || isPending
          }
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default UserTier;
