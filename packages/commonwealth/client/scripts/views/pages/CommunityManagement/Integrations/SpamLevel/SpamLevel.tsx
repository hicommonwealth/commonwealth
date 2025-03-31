import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { CWDropdown } from 'client/scripts/views/components/component_kit/cw_dropdown';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useCallback, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import './SpamLevel.scss';

const SpamLevel = () => {
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: false,
    });

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: community?.id || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [spamTierLevel, setSpamTierLevel] = useState<number>(0);

  useRunOnceOnCondition({
    callback: () => {
      setSpamTierLevel(community?.spam_tier_level || 0);
    },
    shouldRun: !isLoadingCommunity && !!community,
  });

  const onSaveChanges = useCallback(async () => {
    if (
      isSaving ||
      !community?.id ||
      spamTierLevel === community?.spam_tier_level
    )
      return;

    try {
      setIsSaving(true);
      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community?.id,
          spamTierLevel,
        }),
      );
      notifySuccess('Updated auto spam level');
    } catch {
      notifyError('Failed to update auto spam level!');
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    community?.id,
    community?.spam_tier_level,
    spamTierLevel,
    updateCommunity,
  ]);

  const options = [
    { label: 'Unverified', value: '0' },
    { label: 'Less than one week old', value: '1' },
    { label: 'One week old', value: '2' },
    { label: '3', value: '3' },
  ];

  return (
    <section className="SpamLevel">
      <div className="header">
        <CWText type="h4">Auto Flag Spam Tier Level</CWText>
      </div>

      <CWText type="b1">
        Automatically flag posts as spam when poster does not meet the specified
        tier level. This is useful for communities that are not yet ready to be
        moderated.
      </CWText>

      <div>
        <CWDropdown
          disabled={isLoadingCommunity}
          initialValue={options[spamTierLevel]}
          options={options}
          onSelect={(item) => {
            setSpamTierLevel(+item.value);
          }}
        />
      </div>

      <CWButton
        containerClassName="action-btn"
        buttonType="secondary"
        label="Save Changes"
        disabled={
          spamTierLevel === community?.spam_tier_level || isLoadingCommunity
        }
        onClick={onSaveChanges}
      />
    </section>
  );
};

export default SpamLevel;
