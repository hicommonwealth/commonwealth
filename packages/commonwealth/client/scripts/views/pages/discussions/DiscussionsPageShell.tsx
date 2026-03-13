import { ActionGroups, GatedActionEnum } from '@hicommonwealth/shared';
import React from 'react';
import { saveToClipboard } from 'shared/utils/clipboard';
import type { ThreadFeaturedFilterTypes } from '../../../models/types';
import { AdminOnboardingSlider } from '../../components/AdminOnboardingSlider';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { CWText } from '../../components/component_kit/cw_text';
import { CWGatedTopicBanner } from '../../components/component_kit/CWGatedTopicBanner';
import CWIconButton from '../../components/component_kit/new_designs/CWIconButton';
import CWPageLayout from '../../components/component_kit/new_designs/CWPageLayout';
import TokenBanner from '../../components/TokenBanner';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { DiscussionsFeedDiscovery } from './DiscussionsFeedDiscovery';

type DiscussionsPageShellProps = {
  actionGroups: ActionGroups;
  bypassGating: boolean;
  canShowGatingBanner: boolean;
  children: React.ReactNode;
  communityId: string;
  containerRef: React.RefObject<HTMLDivElement>;
  featuredFilter: ThreadFeaturedFilterTypes;
  onCloseGatingBanner: () => void;
  tokenBanner: {
    avatarUrl?: string | null;
    chainEthId: number;
    chainName?: string;
    name?: string | null;
    ticker?: string | null;
    tokenAddress: string;
    voteWeight: string;
  } | null;
};

export const DiscussionsPageShell = ({
  actionGroups,
  bypassGating,
  canShowGatingBanner,
  children,
  communityId,
  containerRef,
  featuredFilter,
  onCloseGatingBanner,
  tokenBanner,
}: DiscussionsPageShellProps) => (
  <CWPageLayout ref={containerRef} className="DiscussionsPageLayout">
    <DiscussionsFeedDiscovery
      orderBy={featuredFilter}
      community={communityId}
      includePinnedThreads={true}
    />

    <Breadcrumbs />
    <UserTrainingSlider />
    <AdminOnboardingSlider />

    {tokenBanner && (
      <TokenBanner
        name={tokenBanner.name || undefined}
        ticker={tokenBanner.ticker || undefined}
        avatarUrl={tokenBanner.avatarUrl || undefined}
        tokenAddress={tokenBanner.tokenAddress}
        chainName={tokenBanner.chainName}
        chainEthId={tokenBanner.chainEthId}
        voteWeight={tokenBanner.voteWeight}
        popover={{
          title: tokenBanner.name || undefined,
          body: (
            <CWText type="b2" className="token-description">
              This topic has weighted voting enabled using{' '}
              <span className="token-address">{tokenBanner.tokenAddress}</span>
              <CWIconButton
                iconName="copy"
                onClick={() => {
                  saveToClipboard(tokenBanner.tokenAddress, true).catch(
                    console.error,
                  );
                }}
              />
            </CWText>
          ),
        }}
      />
    )}

    {canShowGatingBanner && (
      <CWGatedTopicBanner
        actions={Object.values(GatedActionEnum)}
        actionGroups={actionGroups}
        bypassGating={bypassGating}
        onClose={onCloseGatingBanner}
      />
    )}

    {children}
  </CWPageLayout>
);
