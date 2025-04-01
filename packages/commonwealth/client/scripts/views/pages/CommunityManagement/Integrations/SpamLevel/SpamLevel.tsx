import useRunOnceOnCondition from 'client/scripts/hooks/useRunOnceOnCondition';
import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { CWToggle } from 'client/scripts/views/components/component_kit/cw_toggle';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList';
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

  const [isEnabled, setIsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [spamTierLevel, setSpamTierLevel] = useState(-1);

  useRunOnceOnCondition({
    callback: () => {
      const tier =
        typeof community?.spam_tier_level === 'number'
          ? community?.spam_tier_level
          : -1;
      setIsEnabled(tier >= 0);
      setSpamTierLevel(tier >= -1 && tier <= 2 ? tier : -1);
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
    { label: 'Unverified users', value: '0' },
    { label: 'One week-old users with incomplete profiles', value: '1' },
    { label: 'Users with incomplete profiles', value: '2' },
  ];

  return (
    <section className="SpamLevel">
      <div className="header">
        <CWText type="h4">Auto Flag Spam</CWText>
        <CWToggle
          checked={isEnabled}
          onChange={() => {
            setIsEnabled(!isEnabled);
            setSpamTierLevel(-1);
          }}
        />
      </div>
      <CWText type="b1">
        Automatically flag posts as spam when poster does not meet the specified
        tier level. This is useful for communities that are not yet ready to be
        moderated.
      </CWText>

      {isEnabled && (
        <div>
          <CWSelectList
            defaultValue={options[spamTierLevel]}
            options={options}
            onChange={(item) => {
              item && setSpamTierLevel(+item.value);
            }}
          />
        </div>
      )}
      <CWButton
        containerClassName="action-btn"
        buttonType="secondary"
        label="Save Changes"
        disabled={
          spamTierLevel === community?.spam_tier_level || isLoadingCommunity
        }
        // eslint-disable-next-line
        onClick={onSaveChanges}
      />
    </section>
  );
};

export default SpamLevel;
