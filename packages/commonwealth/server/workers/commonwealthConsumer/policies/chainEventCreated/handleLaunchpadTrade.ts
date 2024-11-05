import { events, LaunchpadTrade } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { z } from 'zod';

export async function handleLaunchpadTrade(
  event: z.infer<typeof events.ChainEventCreated>,
) {
  const {
    0: trader,
    1: tokenAddress,
    2: isBuy,
    3: communityTokenAmount,
    // 4: ethAmount,
    // 5: protocolEthAmount,
    6: floatingSupply,
  } = event.parsedArgs as z.infer<typeof LaunchpadTrade>;

  const token = await models.Token.findOne({
    where: {
      token_address: tokenAddress,
    },
  });

  if (!token) {
    throw new Error('Token not found');
  }

  // const trade = await models.LaunchpadTrade.findOrCreate({
  //   where: {
  //     transaction_hash: '',
  //     eth_chain_id:
  //   }
  // })
}
