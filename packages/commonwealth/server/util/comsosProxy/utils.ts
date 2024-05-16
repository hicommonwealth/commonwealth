import { logger } from '@hicommonwealth/logging';
import { ChainNodeInstance, models } from '@hicommonwealth/model';
import { CosmosGovernanceVersion, NodeHealth } from '@hicommonwealth/shared';
import axios, { AxiosResponse } from 'axios';
import { Request } from 'express';
import _ from 'lodash';
import { fileURLToPath } from 'url';

export const IGNORE_COSMOS_CHAIN_IDS = ['csdk', 'evmosdev'];

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const DEVNET_COSMOS_ID_RE = /^(csdk|evmosdev)/;
const IGNORE_COSMOS_METHODS = ['tx', 'auth'];
const IGNORE_ERRORS = ['cosmos_chain_id is required'];

/**
 * Upgrades the Cosmos gov version status to `v1beta1Failed` on the respective ChainNode if a query to a Cosmos
 * v1beta1 governance module fails.
 * @param {Request} req - the original Express request object sent to the proxy route
 * @param {AxiosResponse} res - an axios response object resulting from a query to the gov module of a Cosmos chain
 * @param {ChainNodeAttributes} chainNode - A ChainNode instance
 */
export async function upgradeBetaNodeIfNeeded(
  req: Request,
  res: AxiosResponse,
  chainNode: ChainNodeInstance,
): Promise<void> {
  if (!req.body?.params?.path?.includes('/cosmos.gov.v1beta1.Query')) return;

  if (
    res.data?.result?.response?.log?.includes(
      `can't convert a gov/v1 Proposal to gov/v1beta1 Proposal`,
    )
  ) {
    await models.ChainNode.update(
      { cosmos_gov_version: CosmosGovernanceVersion.v1beta1Failed },
      { where: { id: chainNode.id } },
    );
  }
}

/**
 * Upgrades the Cosmos gov version status to `v1` on the respective ChainNode if a previous query to a Cosmos
 * governance module failed due to a governance module version mismatch.
 * @param {Request} req - the original Express request object sent to the proxy route
 * @param {ChainNodeAttributes} chainNode - A ChainNode instance
 */
export async function updateV1NodeIfNeeded(
  req: Request,
  chainNode: ChainNodeInstance,
): Promise<void> {
  if (!req.originalUrl?.includes('cosmos/gov/v1')) return;

  const dbGovVersion = chainNode.cosmos_gov_version;
  const shouldUpdate =
    !dbGovVersion || dbGovVersion === CosmosGovernanceVersion.v1beta1Failed;

  if (shouldUpdate) {
    await models.ChainNode.update(
      { cosmos_gov_version: CosmosGovernanceVersion.v1 },
      { where: { id: chainNode.id } },
    );
  }
}

/**
 * Queries a chains Cosmos slip44 value and updates it if it is missing in the DB. This is especially
 * useful for determining the type of the Cosmos chain (e.g. Cosmos EVM chains).
 */
export async function updateSlip44IfNeeded(
  chainNode: ChainNodeInstance,
): Promise<void> {
  try {
    const slip44 = chainNode?.slip44;
    if (slip44 || DEVNET_COSMOS_ID_RE.test(chainNode.cosmos_chain_id)) return;

    const registeredChain = await axios.get(
      `https://chains.cosmos.directory/${chainNode.cosmos_chain_id}`,
      {
        headers: {
          origin: 'https://commonwealth.im',
          Referer:
            process.env.COSMOS_PROXY_REFERER || 'https://commonwealth.im',
        },
      },
    );

    if (registeredChain && registeredChain?.data?.chain?.slip44) {
      chainNode.slip44 = registeredChain.data.chain.slip44;
      await chainNode.save();
    }
  } catch (err) {
    // don't need to throw here, just trying to update slip44 if available
    log.error('Error querying for registered chain', err, {
      cosmos_chain_id: chainNode.cosmos_chain_id,
    });
  }
}

/**
 * Updates the status of a Cosmos chain-node's health based on whether or not a recent (provided) query was
 * successful.
 * @param req - the original Express request object sent to the proxy route
 * @param chainNode - a ChainNode instance
 * @param contextData - an object containing the successful axios request response or the axios error
 */
export async function updateNodeHealthIfNeeded(
  req: Request,
  chainNode: ChainNodeInstance,
  contextData: { response: AxiosResponse } | { error: unknown },
): Promise<void> {
  try {
    if (
      !chainNode.cosmos_chain_id ||
      IGNORE_COSMOS_CHAIN_IDS.includes(chainNode.cosmos_chain_id) ||
      IGNORE_COSMOS_METHODS.includes(req.body?.method)
    ) {
      return;
    }

    // handle node errors
    if ('error' in contextData) {
      if (chainNode.health === NodeHealth.Failed) return;

      // ignore errors that are not related to Node health
      if (
        contextData.error instanceof Error &&
        Object.values(IGNORE_ERRORS).some((err) =>
          (contextData.error as Error).message?.includes(err),
        )
      ) {
        return;
      }

      chainNode.health = NodeHealth.Failed;
      await chainNode.save();
    } else {
      if (chainNode.health === NodeHealth.Healthy) return;

      if (chainNode.url.includes(contextData.response.request.host)) {
        chainNode.health = NodeHealth.Healthy;
        await chainNode.save();
      }
    }
  } catch (err) {
    log.error('Error updating node health', err, {
      request: req,
      chainNodeId: chainNode.id,
      contextData,
    });
  }
}

export async function queryExternalProxy(
  req: Request,
  webProtocol: 'RPC' | 'REST',
  chainNode: ChainNodeInstance,
) {
  let url: string;
  const proxyUrl = `https://${webProtocol}.cosmos.directory/${chainNode.cosmos_chain_id}`;
  if (webProtocol === 'RPC') {
    url = req.originalUrl.replace(req.originalUrl, proxyUrl);
  } else {
    url = req.originalUrl.replace(req.baseUrl, proxyUrl);
  }

  return await axios.post(url, _.isEmpty(req.body) ? null : req.body, {
    headers: {
      origin: 'https://commonwealth.im',
      Referer: process.env.COSMOS_PROXY_REFERER || 'https://commonwealth.im',
    },
  });
}
