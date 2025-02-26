import { EventHandler } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleTokenLocked: EventHandler<
  'TokenLocked',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenLocked', payload);
};

export const handleTokenLockDurationIncreased: EventHandler<
  'TokenLockDurationIncreased',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenLockDurationIncreased', payload);
};

export const handleTokenUnlocked: EventHandler<
  'TokenUnlocked',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenUnlocked', payload);
};

export const handleTokenPermanentConverted: EventHandler<
  'TokenPermanentConverted',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenPermanentConverted', payload);
};

export const handleTokenDelegated: EventHandler<
  'TokenDelegated',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenDelegated', payload);
};

export const handleTokenUndelegated: EventHandler<
  'TokenUndelegated',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenUndelegated', payload);
};

export const handleTokenMerged: EventHandler<
  'TokenMerged',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenMerged', payload);
};
