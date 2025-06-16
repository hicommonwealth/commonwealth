import { COMMUNITY_SPAM_TIER } from '@hicommonwealth/schemas';
import { DisabledCommunitySpamTier, UserTierMap } from '@hicommonwealth/shared';
import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { CWToggle } from 'client/scripts/views/components/component_kit/cw_toggle';
import { CWSelectList } from 'client/scripts/views/components/component_kit/new_designs/CWSelectList';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { z } from 'zod';
import './SpamLevel.scss';
import { SpamLevelOptions } from './utils';
const SpamLevel = () => {
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
      includeNodeInfo: false,
    });

  const { mutateAsync: updateCommunity, isPending } =
    useUpdateCommunityMutation({
      communityId: community?.id || '',
    });

  const [isEnabled, setIsEnabled] = useState(false);
  const [spamTierLevel, setSpamTierLevel] = useState<
    z.infer<typeof COMMUNITY_SPAM_TIER>
  >(DisabledCommunitySpamTier);

  useEffect(() => {
    if (!isLoadingCommunity && community) {
      const tier =
        typeof community.spam_tier_level === 'number'
          ? community.spam_tier_level
          : DisabledCommunitySpamTier;

      const isSpamEnabled = tier !== DisabledCommunitySpamTier;
      setIsEnabled(isSpamEnabled);

      setSpamTierLevel(
        tier >= DisabledCommunitySpamTier && tier <= UserTierMap.VerifiedWallet
          ? tier
          : DisabledCommunitySpamTier,
      );
    }
  }, [isLoadingCommunity, community]);

  const onSaveChanges = useCallback(async () => {
    if (
      isPending ||
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
    isPending,
    community?.id,
    community?.spam_tier_level,
    spamTierLevel,
    updateCommunity,
  ]);

  const handleToggleChange = () => {
    const newIsEnabled = !isEnabled;
    setIsEnabled(newIsEnabled);

    if (!newIsEnabled) {
      setSpamTierLevel(DisabledCommunitySpamTier);
    } else if (spamTierLevel === DisabledCommunitySpamTier) {
      setSpamTierLevel(UserTierMap.NewlyVerifiedWallet);
    }
  };

  return (
    <section className="SpamLevel">
      <div className="header">
        <CWText type="h4">Auto Flag Spam</CWText>
        <CWToggle checked={isEnabled} onChange={handleToggleChange} />
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
            defaultValue={SpamLevelOptions.find(
              (option) => option.value === spamTierLevel,
            )}
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
