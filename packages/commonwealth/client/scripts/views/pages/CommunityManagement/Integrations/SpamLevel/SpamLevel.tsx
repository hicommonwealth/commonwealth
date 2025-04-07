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
import { SpamLevelOptions, SpamLevels } from './utils';

const SpamLevel = () => {
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: false,
    });

  const { mutateAsync: updateCommunity, isLoading } =
    useUpdateCommunityMutation({
      communityId: community?.id || '',
    });

  const [isEnabled, setIsEnabled] = useState(false);
  const [spamTierLevel, setSpamTierLevel] = useState<SpamLevels>(
    SpamLevels.Disabled,
  );

  useRunOnceOnCondition({
    callback: () => {
      const tier =
        typeof community?.spam_tier_level === 'number'
          ? community?.spam_tier_level
          : SpamLevels.Disabled;
      setIsEnabled(tier > SpamLevels.Disabled);
      setSpamTierLevel(
        tier >= SpamLevels.Disabled &&
          tier <= SpamLevels.UsersWithIncompleteProfiles
          ? tier
          : SpamLevels.Disabled,
      );
    },
    shouldRun: !isLoadingCommunity && !!community,
  });

  const onSaveChanges = useCallback(async () => {
    if (
      isLoading ||
      !community?.id ||
      spamTierLevel === community?.spam_tier_level
    )
      return;

    try {
      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community?.id,
          spamTierLevel,
        }),
      );
      notifySuccess('Updated auto spam level');
    } catch {
      notifyError('Failed to update auto spam level!');
    }
  }, [
    isLoading,
    community?.id,
    community?.spam_tier_level,
    spamTierLevel,
    updateCommunity,
  ]);

  return (
    <section className="SpamLevel">
      <div className="header">
        <CWText type="h4">Auto Flag Spam</CWText>
        <CWToggle
          checked={isEnabled}
          onChange={() => {
            setIsEnabled(!isEnabled);
            setSpamTierLevel(isEnabled ? spamTierLevel : SpamLevels.Disabled);
          }}
        />
      </div>
      <CWText type="b1">
        Automatically flag posts as spam when poster does not meet the specified
        tier level. This is useful for communities that are not yet ready to be
        moderated.
      </CWText>
      <CWText type="b1" className="docs-link">
        <a
          href="https://docs.common.xyz/commonwealth/account-overview/user-trust-levels"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more about how trust levels work
        </a>
      </CWText>

      {isEnabled && (
        <div>
          <CWSelectList
            defaultValue={SpamLevelOptions[spamTierLevel]}
            options={SpamLevelOptions}
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
