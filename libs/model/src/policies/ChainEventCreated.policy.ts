import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { ZodUndefined } from 'zod';
import { handleCommunityStakeTrades } from './handlers/handleCommunityStakeTrades';
import { handleJudgeNominated } from './handlers/handleJudgeNominated';
import { handleNamespaceDeployed } from './handlers/handleNamespaceDeployed';
import { handleNamespaceDeployedWithReferral } from './handlers/handleNamespaceDeployedWithReferral';
import { handleReferralFeeDistributed } from './handlers/handleReferralFeeDistributed';
import {
  handleTokenDelegated,
  handleTokenLockDurationIncreased,
  handleTokenLocked,
  handleTokenMerged,
  handleTokenPermanentConverted,
  handleTokenUndelegated,
  handleTokenUnlocked,
} from './handlers/handleTokenStaking';

const chainEventInputs = {
  CommunityStakeTrade: events.CommunityStakeTrade,
  NamespaceDeployed: events.NamespaceDeployed,
  NamespaceDeployedWithReferral: events.NamespaceDeployedWithReferral,
  ReferralFeeDistributed: events.ReferralFeeDistributed,
  // TokenStaking
  TokenLocked: events.TokenLocked,
  TokenLockDurationIncreased: events.TokenLockDurationIncreased,
  TokenUnlocked: events.TokenUnlocked,
  TokenPermanentConverted: events.TokenPermanentConverted,
  TokenDelegated: events.TokenDelegated,
  TokenUndelegated: events.TokenUndelegated,
  TokenMerged: events.TokenMerged,
  JudgeNominated: events.JudgeNominated,
};

export function ChainEventPolicy(): Policy<
  typeof chainEventInputs,
  ZodUndefined
> {
  return {
    inputs: chainEventInputs,
    body: {
      CommunityStakeTrade: handleCommunityStakeTrades,
      NamespaceDeployed: handleNamespaceDeployed,
      NamespaceDeployedWithReferral: handleNamespaceDeployedWithReferral,
      ReferralFeeDistributed: handleReferralFeeDistributed,
      // TokenStaking
      TokenLocked: handleTokenLocked,
      TokenLockDurationIncreased: handleTokenLockDurationIncreased,
      TokenUnlocked: handleTokenUnlocked,
      TokenPermanentConverted: handleTokenPermanentConverted,
      TokenDelegated: handleTokenDelegated,
      TokenUndelegated: handleTokenUndelegated,
      TokenMerged: handleTokenMerged,
      JudgeNominated: handleJudgeNominated,
    },
  };
}
