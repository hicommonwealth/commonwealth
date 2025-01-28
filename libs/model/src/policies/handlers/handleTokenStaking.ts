import { EvmEventSignatures } from '@hicommonwealth/evm-protocols';
import { chainEvents, events } from '@hicommonwealth/schemas';
import { z } from 'zod';

async function handleTokenLocked(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: user_address,
    1: locked_amount,
    2: token_id,
    3: duration,
    4: is_permanent,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenLocked
  >;
  return await Promise.resolve({
    user_address,
    locked_amount,
    token_id,
    duration,
    is_permanent,
  });
}

async function handleTokenLockDurationIncreased(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 0: token_id, 1: new_duration } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenLockDurationIncreased
  >;
  return await Promise.resolve({ token_id, new_duration });
}

async function handleTokenUnlocked(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: user_address,
    1: token_id,
    2: locked_amount,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenUnlocked
  >;
  return await Promise.resolve({
    user_address,
    token_id,
    locked_amount,
  });
}

async function handleTokenPermanentConverted(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: user_address,
    1: token_id,
    2: locked_amount,
    3: duration,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenPermanentConverted
  >;
  return await Promise.resolve({
    user_address,
    token_id,
    locked_amount,
    duration,
  });
}

async function handleTokenDelegated(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: from_user_address,
    1: to_user_address,
    2: token_id,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenDelegated
  >;
  return await Promise.resolve({
    from_user_address,
    to_user_address,
    token_id,
  });
}

async function handleTokenUndelegated(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const { 0: token_id } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenUndelegated
  >;
  return await Promise.resolve({
    token_id,
  });
}

async function handleTokenMerged(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: user_address,
    1: from_token_id,
    2: to_token_id,
    3: new_amount,
    4: new_duration,
  } = event.parsedArgs as z.infer<
    typeof chainEvents.TokenStakingSchemas.TokenMerged
  >;
  return await Promise.resolve({
    user_address,
    from_token_id,
    to_token_id,
    new_amount,
    new_duration,
  });
}

export async function handleTokenStaking(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  switch (event.eventSource.eventSignature) {
    case EvmEventSignatures.TokenStaking.TokenLocked:
      return await handleTokenLocked(event);
    case EvmEventSignatures.TokenStaking.TokenLockDurationIncreased:
      return await handleTokenLockDurationIncreased(event);
    case EvmEventSignatures.TokenStaking.TokenUnlocked:
      return await handleTokenUnlocked(event);
    case EvmEventSignatures.TokenStaking.TokenPermanentConverted:
      return await handleTokenPermanentConverted(event);
    case EvmEventSignatures.TokenStaking.TokenDelegated:
      return await handleTokenDelegated(event);
    case EvmEventSignatures.TokenStaking.TokenUndelegated:
      return await handleTokenUndelegated(event);
    case EvmEventSignatures.TokenStaking.TokenMerged:
      return await handleTokenMerged(event);
    default:
      throw new Error('Invalid event signature');
  }
}
