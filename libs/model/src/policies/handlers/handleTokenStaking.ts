import { EventHandler } from '@hicommonwealth/core';
import { ZodUndefined } from 'zod';

export const handleTokenLocked: EventHandler<
  'TokenLocked',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenLocked', payload);
  await Promise.resolve();
};

export const handleTokenLockDurationIncreased: EventHandler<
  'TokenLockDurationIncreased',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenLockDurationIncreased', payload);
  await Promise.resolve();
};

export const handleTokenUnlocked: EventHandler<
  'TokenUnlocked',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenUnlocked', payload);
  await Promise.resolve();
};

export const handleTokenPermanentConverted: EventHandler<
  'TokenPermanentConverted',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenPermanentConverted', payload);
  await Promise.resolve();
};

export const handleTokenDelegated: EventHandler<
  'TokenDelegated',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenDelegated', payload);
  await Promise.resolve();
};

export const handleTokenUndelegated: EventHandler<
  'TokenUndelegated',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenUndelegated', payload);
  await Promise.resolve();
};

export const handleTokenMerged: EventHandler<
  'TokenMerged',
  ZodUndefined
> = async ({ payload }) => {
  console.log('handleTokenMerged', payload);
  await Promise.resolve();
};
