import { blobStorage, command, logger } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { ClankerToken } from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import lo from 'lodash';
import moment from 'moment';
import { Op } from 'sequelize';
import { uuidV4 } from 'web3-utils';
import { z } from 'zod';
import { CreateCommunity } from '../../community';
import { models } from '../../database';
import { systemActor } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { compressServerImage } from '../../utils/imageCompression';

const log = logger(import.meta);

/**
 * Asynchronously paginates through Clanker tokens.
 *
 * This function fetches tokens from the Clanker API in pages and yields batches of tokens that were
 * created after the specified cutoff date. It continues fetching pages until one of the following conditions is met:
 *
 * - The API indicates there are no more pages available.
 * - A fetched page returns no tokens.
 * - The oldest token in the fetched page is older than the cutoff date.
 *
 * An axios instance with retry logic is used to handle rate limits (HTTP 429) and server errors (HTTP status >= 500).
 *
 * @param {Object} params - The function parameters.
 * @param {Date} params.cutoffDate - The cutoff date; only tokens created after this date are yielded.
 * @param {boolean} params.desc - If true, tokens are fetched in descending order; if false, in ascending order.
 * @returns {AsyncGenerator<Array<z.infer<typeof ClankerToken>>, void, unknown>} An async generator that yields arrays of tokens meeting the cutoff criteria.
 *
 * @throws Will throw an error if the token fetching fails after retrying.
 */
export async function* paginateClankerTokens({
  cutoffDate,
  desc,
}: {
  cutoffDate: Date;
  desc: boolean;
}): AsyncGenerator<Array<z.infer<typeof ClankerToken>>, void, unknown> {
  const axiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryDelay: (retryCount: number) => 5000 * Math.pow(2, retryCount - 1),
    retryCondition: (error: AxiosError) =>
      error.response?.status === 429 || (error.response?.status ?? 0) >= 500,
  });

  let pageNum = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://www.clanker.world/api/tokens?sort=${desc ? 'desc' : 'asc'}&page=${pageNum}&pair=all&partner=all&presale=all`;
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
    } catch (err: unknown) {
      log.error(`Error fetching clanker tokens: ${(err as Error).message}`);
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

/**
 * Generates a compliant community name and unique ID based on the provided community name.
 *
 * @param {string} name - The original community name.
 * @returns {Promise<
 *   | { id: string; name: string; error: null }
 *   | { id: null; name: null; error: string }
 * >}
 */
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
  if (baseId.length === 0) {
    return {
      id: null,
      name: null,
      error: `generated ID has zero length: original="${name}" formatted="${communityName}"`,
    };
  }

  // Find all communities that start with this base ID
  const existingCommunities = await models.Community.findAll({
    where: {
      id: {
        [Op.like]: `${baseId}%`,
      },
    },
    attributes: ['id'],
    order: [['created_at', 'ASC']],
  });

  // If no communities exist with this base ID, use it
  if (existingCommunities.length === 0) {
    return {
      id: baseId,
      name: communityName,
      error: null,
    };
  }

  // Check if the base ID exists without a number suffix
  const baseIdExists = existingCommunities.some(
    (community) => community.id === baseId,
  );

  if (!baseIdExists) {
    return {
      id: baseId,
      name: communityName,
      error: null,
    };
  }

  // Find the maximum number suffix used
  const maxNumber = existingCommunities.reduce((max, community) => {
    const match = community.id.match(new RegExp(`^${baseId}-([0-9]+)$`));
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 1); // Start with 1 as the minimum

  // Use the maximum number + 1
  const nextNumber = maxNumber + 1;

  if (nextNumber > 10) {
    return {
      id: null,
      name: null,
      error: `too many conflicting community IDs for: ${baseId} (checked first 10)`,
    };
  }

  const newId = `${baseId}-${nextNumber}`;
  const newName = `${communityName} (${nextNumber})`;

  return {
    id: newId,
    name: newName,
    error: null,
  };
}

async function uploadTokenImage(
  imageUrl?: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl?.length) {
    return null;
  }
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const buffer = Buffer.from(res.data);
    const compressedBuffer = await compressServerImage(buffer);
    const { url } = await blobStorage().upload({
      key: `${uuidV4()}.png`,
      bucket: 'assets',
      content: compressedBuffer,
      contentType: 'image/jpeg',
    });
    return url;
  } catch (err) {
    log.error(
      `failed to download clanker token image: ${(err as Error).message}`,
    );
    return null;
  }
}

/**
 * Creates a community based on the provided Clanker token payload.
 *
 * @param {z.infer<typeof ClankerToken>} payload - The Clanker token payload containing the details required to create the community.
 * @returns {Promise<void>} A promise that resolves when the community creation process is complete.
 *
 * @throws Error for missing chain node or admin address
 */
export async function createCommunityFromClankerToken(
  payload: z.infer<typeof ClankerToken>,
) {
  const { id, name, error } = await generateUniqueId(
    `Clanker - ${payload.name}`,
  );
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

  const uploadedImageUrl = await uploadTokenImage(payload.img_url);

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
      tags: ['Clanker'],
      chain_node_id: chainNode!.id!,
      community_indexer_id: 'clanker',
      token_address: payload.contract_address,
      token_created_at: moment(payload.created_at).toDate(),
    };
  if (uploadedImageUrl) {
    createCommunityPayload.icon_url = uploadedImageUrl;
  }

  await command(CreateCommunity(), {
    actor: systemActor({
      id: adminAddress.user_id!,
      address: adminAddress.address,
    }),
    payload: createCommunityPayload,
  });

  log.debug(`created clanker community: ${id} = '${name}'`);
}
