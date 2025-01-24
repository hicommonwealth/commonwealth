import { command, logger } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { ClankerToken } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import lo from 'lodash';
import moment from 'moment';
import { z } from 'zod';
import { CreateCommunity } from '../../community';
import { models } from '../../database';
import { systemActor } from '../../middleware';
import { mustExist } from '../../middleware/guards';

const log = logger(import.meta);

export async function* paginateClankerTokens(
  cutoffDate: Date,
): AsyncGenerator<Array<z.infer<typeof ClankerToken>>, void, unknown> {
  const axiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: (retryCount) => 5000 * Math.pow(2, retryCount - 1),
    retryCondition: (error) =>
      error.response?.status === 429 || (error.response?.status ?? 0) >= 500,
  });

  let pageNum = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://www.clanker.world/api/tokens?sort=desc&page=${pageNum}&pair=all&partner=all&presale=all`;
    log.debug(`fetching: ${url}`);

    try {
      // Use the axios instance with retry logic
      const res = await axiosInstance.get<{
        data: Array<z.infer<typeof ClankerToken>>;
        hasMore: boolean;
      }>(url);

      // If no tokens were returned, we're done
      if (!res.data.hasMore || res.data.data.length === 0) {
        log.debug('No more tokens found');
        break;
      }

      // Filter tokens by cutoffDate
      const validTokens = res.data.data.filter((t) =>
        moment(t.created_at).isAfter(cutoffDate),
      );

      // Yield valid tokens
      if (validTokens.length > 0) {
        yield validTokens;
      }

      // Check if the oldest token is older than our cutoff date
      const oldestToken = res.data.data[res.data.data.length - 1];
      if (moment(oldestToken.created_at).isBefore(cutoffDate)) {
        break;
      }

      // Move to the next page
      pageNum++;
    } catch (err: any) {
      log.error(`Error fetching clanker tokens: ${err.message}`);
      throw err;
    }
  }
}

function formatCommunityName(input: string) {
  return (
    input
      // eslint-disable-next-line no-useless-escape
      .replace(/[^a-zA-Z0-9!@#&():_$\/\\|.\- ]+/g, '') // Keep only allowed characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with one
      .trim()
  ); // Trim leading and trailing spaces
}

export async function generateUniqueId(
  name: string,
): Promise<
  | { id: string; name: string; error: null }
  | { id: null; name: null; error: string }
> {
  const communityName = formatCommunityName(name.trim());
  if (communityName.length <= 3) {
    return {
      id: null,
      name: null,
      error: `formatted community name too short: original="${name}" formatted="${communityName}"`,
    };
  }
  const baseId = lo.kebabCase(communityName);
  let idCandidate = baseId;
  let counter = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    counter++;
    if (counter >= 100) {
      return {
        id: null,
        name: null,
        error: `too many conflicting community IDs for: ${baseId} (found ${counter})`,
      };
    }
    const existing = await models.Community.findOne({
      where: { id: idCandidate },
    });
    if (!existing) {
      break;
    }
    idCandidate = `${baseId}-${counter}`;
  }
  return {
    id: idCandidate,
    name: counter === 1 ? communityName : `${communityName} (${counter})`,
    error: null,
  };
}

export async function createCommunityFromClankerToken(
  payload: z.infer<typeof ClankerToken>,
) {
  const { id, name, error } = await generateUniqueId(payload.name);
  if (error) {
    log.warn(error);
    return;
  }

  const chainNode = await models.ChainNode.scope('withPrivateData').findOne({
    where: {
      name: 'Base',
      eth_chain_id: commonProtocol.ValidChains.Base,
    },
  });
  mustExist('Chain Node', chainNode);

  const web3 = commonProtocol.createPrivateEvmClient({
    rpc: chainNode.private_url!,
    privateKey: config.WEB3.PRIVATE_KEY,
  });
  const adminAddress = await models.Address.findOne({
    where: {
      address: web3.eth.defaultAccount!,
    },
  });
  mustExist('Admin Address', adminAddress);

  // let uploadedImageUrl: string | null = null;
  // if (payload.img_url) {
  //   const filename = `${uuidv4()}.jpeg`;
  //   const content = await axios.get(payload.img_url!);
  //   const { url } = await blobStorage().upload({
  //     key: filename,
  //     bucket: 'assets',
  //     content: content.data,
  //   });
  //   uploadedImageUrl = url;
  // }

  const createCommunityPayload: z.infer<typeof schemas.CreateCommunity.input> =
    {
      id: id!,
      type: ChainType.Token,
      name: name!,
      default_symbol: payload.symbol,
      base: ChainBase.Ethereum,
      social_links: [],
      website: `https://www.clanker.world/clanker/${payload.contract_address}`,
      directory_page_enabled: false,
      tags: ['clanker'],
      chain_node_id: chainNode!.id!,
      indexer: 'clanker',
      token_address: payload.contract_address,
    };
  // if (uploadedImageUrl) {
  //   createCommunityPayload.icon_url = uploadedImageUrl;
  // }

  await command(CreateCommunity(), {
    actor: systemActor({
      id: adminAddress.user_id!,
      address: adminAddress.address,
    }),
    payload: createCommunityPayload,
  });

  log.debug(`created clanker community: ${id} –– ${name}`);
}
