import { COMMUNITY_TIERS, CommunityTierMap } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useEffect, useState } from 'react';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import useSetCommunityTierMutation from 'state/api/superAdmin/setCommunityTier';
import { useDebounce } from 'usehooks-ts';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from '../../components/component_kit/new_designs/CWTextInput';
import { openConfirmation } from '../../modals/confirmation_modal';

const getTierLabel = (tier: CommunityTierMap) => {
  const tierInfo = COMMUNITY_TIERS[tier];
  let label = ``;
  if ('clientInfo' in tierInfo) {
    label = `${tierInfo.clientInfo?.icon} ${tierInfo.name}`;
  } else {
    label = tierInfo.name;
  }
  label += ` (${tierInfo.description})`;
  return label;
};

const communityTierOptions = Object.keys(COMMUNITY_TIERS).map((key) => ({
  value: key,
  label: getTierLabel(parseInt(key) as CommunityTierMap),
}));

const CommunityTier = () => {
  const [communityId, setCommunityId] = useState<string>('');
  const debouncedCommunityId = useDebounce<string | undefined>(
    communityId,
    500,
  );
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: debouncedCommunityId || '',
      enabled: !!debouncedCommunityId,
    });

  const [selectedCommunityTier, setSelectedCommunityTier] =
    useState<CommunityTierMap>(CommunityTierMap.Unverified);

  const { mutateAsync: setCommunityTier, isLoading } =
    useSetCommunityTierMutation();

  useEffect(() => {
    if (community) {
      setSelectedCommunityTier(community.tier);
    }
  }, [community]);

  const communityNotFound =
    !isLoadingCommunity &&
    !!debouncedCommunityId &&
    Object.keys(community || {})?.length === 0;

  // Find the current option based on the selected tier
  const selectedOption = communityTierOptions.find(
    (option) => +option.value === selectedCommunityTier,
  );

  const openConfirmationModal = () => {
    openConfirmation({
      title: 'Update Community Tier',
      description: `Are you sure you want to update the tier for ${communityId} to ${selectedOption?.label || ''}?`,
      buttons: [
        {
          label: 'Update',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: async () => {
            try {
              await setCommunityTier({
                community_id: communityId,
                tier: selectedCommunityTier,
              });
              notifySuccess('Community tier updated');
            } catch (e) {
              notifyError('Error updating community tier');
              console.error(e);
            }
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
      <CWText type="h4">Update Community Tier</CWText>
      <CWText type="caption">
        Updates a community&apos;s tier. If the community is large (greater than
        500 threads/users) please contact engineering before executing.
      </CWText>
      <div className="TaskRow">
        <CWTextInput
          value={communityId}
          onInput={(e) => setCommunityId(e?.target?.value?.trim() || '')}
          customError={communityNotFound ? 'Community not found' : ''}
          placeholder="Community id"
          fullWidth
        />
        <CWSelectList
          value={selectedOption}
          options={communityTierOptions}
          onChange={(item) => {
            item && setSelectedCommunityTier(+item.value);
          }}
          isSearchable={false}
        />
        <CWButton
          label="Update"
          className="TaskButton"
          disabled={
            isLoadingCommunity ||
            communityNotFound ||
            !debouncedCommunityId ||
            isLoading
          }
          onClick={openConfirmationModal}
        />
      </div>
    </div>
  );
};

export default CommunityTier;
