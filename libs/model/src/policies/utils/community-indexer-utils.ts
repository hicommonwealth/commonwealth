import { blobStorage, command, logger } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { ClankerToken } from '@hicommonwealth/schemas';
import {
  COMMUNITY_NAME_REGEX,
  ChainBase,
  ChainType,
} from '@hicommonwealth/shared';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import lo from 'lodash';
import moment from 'moment';
import { Op } from 'sequelize';
import { uuidV4 } from 'web3-utils';
import { z } from 'zod';
import { CreateCommunity } from '../../aggregates/community/CreateCommunity.command';
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

/**
 * Formats a community name by removing invalid characters and converting to kebab case.
 *
 * @param {string} input - The original community name.
 * @returns {[string, string] | null} A tuple containing the kebab case formatted name and the original name, or null if the name is invalid.
 */
function formatCommunityName(input: string): [string, string] | null {
  const formatted = input
    // eslint-disable-next-line no-useless-escape
    .replace(/[^a-zA-Z0-9!@#&():_$\/\\|.\- ]+/g, '') // Keep only allowed characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with one
    .trim(); // Trim leading and trailing spaces
  if (!COMMUNITY_NAME_REGEX.test(formatted)) {
    return null;
  }
  return [lo.kebabCase(formatted), formatted];
}

/**
 * Generates a compliant community name and unique ID based on the provided community name.
 *
 * @param {string} name - The original community name.
 * @param {number} clankerTokenId - The token ID to append to the community ID.
 * @returns {Promise<
 *   | { id: string; name: string; error: null }
 *   | { id: null; name: null; error: string }
 * >}
 */
export async function generateUniqueId(
  name: string,
  clankerTokenId: number,
): Promise<
  | { id: string; name: string; error: null }
  | { id: null; name: null; error: string }
> {
  const formattedResult = formatCommunityName(name.trim());
  if (!formattedResult) {
    return {
      id: null,
      name: null,
      error: `invalid community name: original="${name}"`,
    };
  }
  const [kebabCommunityName, communityName] = formattedResult;

  // assume clanker community ID is unique since token ID is unique
  const newCommunityId = `clanker-${kebabCommunityName}-${clankerTokenId}`;

  // check for existing community with same ID
  const existingCommunity = await models.Community.findOne({
    where: {
      id: newCommunityId,
    },
  });
  if (existingCommunity) {
    return {
      id: null,
      name: null,
      error: `community already exists: ${newCommunityId}`,
    };
  }

  // check for ID pattern matches
  const matchingCommunities = await models.Community.findAll({
    where: {
      id: {
        [Op.regexp]: `^clanker-${kebabCommunityName}-[0-9]+$`,
      },
    },
  });

  // no matches, return the base ID and name
  if (matchingCommunities.length === 0) {
    return {
      id: newCommunityId,
      name: communityName,
      error: null,
    };
  }

  // if there are matches, generate an enumerated name
  let suffix = matchingCommunities.length + 1;
  let numberedCommunityName =
    suffix > 1 ? `${communityName} #${suffix}` : communityName;

  // if the numbered community name already exists, keep incrementing the suffix until we find a unique name
  let existingNumberedCommunity = await models.Community.findOne({
    where: { name: numberedCommunityName },
  });
  if (existingNumberedCommunity) {
    let numAttemptsLeft = 5;
    while (existingNumberedCommunity && numAttemptsLeft > 0) {
      suffix++;
      numberedCommunityName = `${communityName} #${suffix}`;
      existingNumberedCommunity = await models.Community.findOne({
        where: { name: numberedCommunityName },
      });
      numAttemptsLeft--;
    }
    if (existingNumberedCommunity) {
      return {
        id: null,
        name: null,
        error: `failed to generate unique ID: ${name}`,
      };
    }
  }

  return {
    id: newCommunityId,
    name: numberedCommunityName,
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
    log.warn(
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
  const { id, name, error } = await generateUniqueId(payload.name, payload.id);
  if (error) {
    throw new Error(`failed to generate unique ID: ${error}`);
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
