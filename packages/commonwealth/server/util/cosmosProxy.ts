import {
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import { AppError, NodeHealth } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { ChainNodeAttributes, DB } from '@hicommonwealth/model';
import { CosmosGovernanceVersion } from '@hicommonwealth/shared';
import axios from 'axios';
import * as express from 'express';
import _ from 'lodash';
import {
  calcCosmosLCDCacheKeyDuration,
  calcCosmosRPCCacheKeyDuration,
} from './cosmosCache';

const log = logger(__filename);
const DEFAULT_CACHE_DURATION = 60 * 10; // 10 minutes
const FALLBACK_NODE_DURATION = +process.env.FALLBACK_NODE_DURATION_S || 300; // 5 min
const ALLOW_FAIL_RE = /^(tx)|(auth)/;
const DEVNET_COSMOS_ID_RE = /^(csdk|evmosdev)/;
enum NonLivenessErrors {
  NeedCosmosChainId = 'cosmos_chain_id is required',
}

function setupCosmosProxy(
  app: express.Express,
  models: DB,
  cacheDecorator: CacheDecorator,
) {
  // using express.text() here because cosmjs generates text/plain type headers
  app.post(
    '/cosmosAPI/:community_id',
    express.text() as express.RequestHandler,
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.trace('Got request:', { body: req.body });
      let cosmos_chain_id, chainNodeUrl, previouslyFailed, isAllowedToFail;
      try {
        isAllowedToFail = ALLOW_FAIL_RE.test(req.body?.method); // all Cosmos chains do TX via RPC
        const communityId = req.params.community_id;
        const community = await models.Community.findOne({
          where: { id: communityId },
          include: models.ChainNode,
        });
        if (!community) {
          throw new AppError(`Invalid chain: ${communityId}`);
        }

        let response;
        const chainNode = community.ChainNode;
        chainNodeUrl = chainNode?.url?.trim();
        let useProxy = !chainNodeUrl;
        cosmos_chain_id = chainNode?.cosmos_chain_id;

        await updateSlip44IfNeeded(chainNode, cosmos_chain_id);

        previouslyFailed = chainNode?.health === NodeHealth.Failed;
        if (previouslyFailed) {
          const lastUpdate = chainNode?.updated_at?.getTime();
          const healthPauseTimeout = new Date(
            lastUpdate + FALLBACK_NODE_DURATION,
          );
          useProxy = previouslyFailed && new Date() > healthPauseTimeout;
        }

        if (chainNodeUrl && !useProxy) {
          log.trace('Found cosmos endpoint:', { chainNodeUrl });
          response = await axios
            .post(chainNodeUrl, req.body, {
              headers: {
                origin: 'https://commonwealth.im',
              },
            })
            .catch(async (err) => {
              log.trace(`Error: ${err.message}`);
              await flagFailedNode(
                isAllowedToFail,
                previouslyFailed,
                cosmos_chain_id,
                chainNodeUrl,
                err,
              );
              return queryExternalProxy(req, cosmos_chain_id, 'rpc');
            });

          await flagHealthyNode(
            response,
            previouslyFailed,
            cosmos_chain_id,
            chainNodeUrl,
          );
        } else {
          response = await queryExternalProxy(req, cosmos_chain_id, 'rpc');
        }

        await upgradeBetaNodeIfNeeded(req, response, community.ChainNode);

        log.trace('Got response from endpoint:', { data: response.data });
        return res.send(response.data);
      } catch (err) {
        const error = { message: err.response?.data?.message ?? err.message };
        await flagFailedNode(
          isAllowedToFail,
          previouslyFailed,
          cosmos_chain_id,
          chainNodeUrl,
          error,
        );
        res.status(500).json(error);
      }
    },
  );

  /**
   *  For Cosmos REST requests, we use the alt_wallet_url which is an LCD enpdpoint.
   *  Used for Cosmos chains that use v1 of the gov module.
   */
  app.use(
    '/cosmosAPI/v1/:community_id',
    express.text() as express.RequestHandler,
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.trace('Got request:', {
        requestUrl: req.originalUrl,
        requestBody: req.body,
      });
      let cosmos_chain_id, chainNodeRestUrl, previouslyFailed, isAllowedToFail;
      try {
        const communityId = req.params.community_id;
        const community = await models.Community.findOne({
          where: { id: communityId },
          include: models.ChainNode,
        });
        if (!community) {
          throw new AppError(`Invalid chain: ${communityId}`);
        }

        let response;
        const chainNode = community.ChainNode;
        cosmos_chain_id = chainNode?.cosmos_chain_id;
        chainNodeRestUrl = chainNode?.alt_wallet_url?.trim();
        let useProxy = !chainNodeRestUrl;
        previouslyFailed = chainNode?.health === NodeHealth.Failed;
        isAllowedToFail = ALLOW_FAIL_RE.test(req.originalUrl); // don't flag health for tx/auth failures

        if (previouslyFailed) {
          const lastUpdate = chainNode?.updated_at?.getTime();
          const healthPauseTimeout = new Date(
            lastUpdate + FALLBACK_NODE_DURATION,
          );
          useProxy = previouslyFailed && new Date() > healthPauseTimeout;
        }

        if (chainNodeRestUrl && !useProxy) {
          log.trace(`Found cosmos endpoint: ${chainNodeRestUrl}`);
          const rewrite = req.originalUrl.replace(
            req.baseUrl,
            chainNodeRestUrl,
          );
          const body = _.isEmpty(req.body) ? null : req.body;

          response = await axios
            .post(rewrite, body, {
              headers: {
                origin: 'https://commonwealth.im',
              },
            })
            .catch(async (err) => {
              log.error('Error:', err, { cosmos_chain_id, chainNodeRestUrl });
              await flagFailedNode(
                isAllowedToFail,
                previouslyFailed,
                cosmos_chain_id,
                chainNodeRestUrl,
                err,
              );
              return queryExternalProxy(req, cosmos_chain_id, 'rest');
            });

          await flagHealthyNode(
            response,
            previouslyFailed,
            cosmos_chain_id,
            chainNodeRestUrl,
          );
        } else {
          response = await queryExternalProxy(req, cosmos_chain_id, 'rest');
        }

        await updateV1NodeIfNeeded(req, response, community.ChainNode);

        log.trace(`Got response: ${JSON.stringify(response.data, null, 2)}`);
        return res.send(response.data);
      } catch (err) {
        const error = { message: err.response?.data?.message ?? err.message };
        await flagFailedNode(
          isAllowedToFail,
          previouslyFailed,
          cosmos_chain_id,
          chainNodeRestUrl,
          error,
        );
        res.status(500).json(error);
      }
    },
  );

  /**
   * When a request fails for any reason, we try the cosmos.directory proxy.
   * If that also fails, it is not a node problem, but probably a request problem.
   * Also used if no preferred node is in our DB.
   */
  const queryExternalProxy = async (
    req,
    cosmos_chain_id: string,
    web_protocol: 'rpc' | 'rest',
  ) => {
    if (!cosmos_chain_id || DEVNET_COSMOS_ID_RE.test(cosmos_chain_id)) return;

    const proxyUrl = `https://${web_protocol}.cosmos.directory/${cosmos_chain_id}`;
    const rewrite = rewriteUrl(req, proxyUrl, web_protocol);
    const body = _.isEmpty(req.body) ? null : req.body;
    log.trace(`Querying proxy: ${proxyUrl}`);

    const response = await axios.post(rewrite, body, {
      headers: {
        origin: 'https://commonwealth.im',
        Referer: process.env.COSMOS_PROXY_REFERER || 'https://commonwealth.im',
      },
    });
    return response;
  };

  const rewriteUrl = (req, proxyUrl: string, web_protocol: 'rpc' | 'rest') => {
    if (web_protocol === 'rpc') {
      return req.originalUrl.replace(req.originalUrl, proxyUrl);
    } else if (web_protocol === 'rest') {
      return req.originalUrl.replace(req.baseUrl, proxyUrl);
    }
    return '';
  };

  const flagFailedNode = async (
    isAllowedToFail: boolean,
    previouslyFailed: boolean,
    cosmos_chain_id: string,
    failedUrl: string,
    error?: any,
  ) => {
    if (isAllowedToFail || previouslyFailed || !cosmos_chain_id) return; // no need to hit db
    if (DEVNET_COSMOS_ID_RE.test(cosmos_chain_id)) return; // skip devnets
    // exclude failed transaction attempts from affecting node health
    if (
      Object.values(NonLivenessErrors).some((nonLivenessError) =>
        error?.message?.includes(nonLivenessError),
      )
    ) {
      return; // not a health issue
    }

    const failedChainNode = await models.ChainNode.findOne({
      where: { cosmos_chain_id },
    });
    if (!failedChainNode) return;

    failedChainNode.health = NodeHealth.Failed;
    await failedChainNode.save();
    log.trace(
      `Problem with endpoint ${failedUrl}.
       Marking node as 'failed' for ${FALLBACK_NODE_DURATION} seconds.`,
      { failedUrl, cosmos_chain_id, error },
    );
  };

  const flagHealthyNode = async (
    response,
    previouslyFailed: boolean,
    cosmos_chain_id: string,
    dbUrl: string,
  ) => {
    if (!cosmos_chain_id || DEVNET_COSMOS_ID_RE.test(cosmos_chain_id)) return;
    // update if the request was successfully made to the DB URL
    // and the node was previously marked as failed
    if (dbUrl?.includes(response.request.host) && previouslyFailed) {
      const healthyChainNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id },
      });
      if (!healthyChainNode) return;
      healthyChainNode.health = NodeHealth.Healthy;
      await healthyChainNode.save();
    }
  };

  const updateSlip44IfNeeded = async (
    communityChainNode: ChainNodeAttributes,
    cosmos_chain_id: string,
  ) => {
    try {
      const slip44 = communityChainNode?.slip44;
      if (slip44 || DEVNET_COSMOS_ID_RE.test(cosmos_chain_id)) return;

      const registeredChain = await axios.get(
        `https://chains.cosmos.directory/${cosmos_chain_id}`,
        {
          headers: {
            origin: 'https://commonwealth.im',
            Referer:
              process.env.COSMOS_PROXY_REFERER || 'https://commonwealth.im',
          },
        },
      );

      if (registeredChain && registeredChain?.data?.chain?.slip44) {
        const chainNode = await models.ChainNode.findOne({
          where: { cosmos_chain_id },
        });
        if (!chainNode) return;
        chainNode.slip44 = registeredChain.data.chain.slip44;
        log.trace('Registered chain found. slip44 recorded.', {
          cosmos_chain_id,
          slip44: registeredChain?.data?.chain?.slip44,
        });
        await chainNode.save();
      }
    } catch (err) {
      // don't need to throw here, just trying to update slip44 if available
      log.error('Error querying for registered chain', err, {
        cosmos_chain_id,
        communityChainNode,
      });
    }
  };

  /**
   *  cosmos-api proxies for the magic link iframe
   * - GET /node_info for fetching chain status (used by magic iframe, and magic login flow)
   * - POST / for node info
   */
  app.options('/magicCosmosAPI/:chain', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'https://auth.magic.link');
    res.header('Access-Control-Allow-Private-Network', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Content-Length, X-Requested-With',
    );
    res.sendStatus(200);
  });

  app.use(
    '/magicCosmosAPI/:chain/?(node_info)?',
    express.text() as express.RequestHandler,
    async (req, res) => {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      // always use cosmoshub for simplicity
      const chainNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id: 'cosmoshub' },
      });
      const targetRestUrl = chainNode?.alt_wallet_url;
      const targetRpcUrl = chainNode?.url;
      log.trace(`Found cosmos endpoint: ${targetRestUrl}, ${targetRpcUrl}`);

      try {
        let response;
        if (req.method === 'POST') {
          response = await axios.get(targetRestUrl + '/node_info', {
            headers: {
              origin: 'https://commonwealth.im/?magic_login_proxy=true',
            },
          });
        }
        log.trace('Response from endpoint', response?.data);

        // magicCosmosAPI is CORS-approved for the magic iframe
        res.setHeader('Access-Control-Allow-Origin', 'https://auth.magic.link');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        return res.send(response.data);
      } catch (err) {
        log.error('Error', err, { targetRestUrl, targetRpcUrl });
        res.status(500).json({ message: err.message });
      }
    },
  );

  const upgradeBetaNodeIfNeeded = async (req, response, chainNode) => {
    if (!req.body?.params?.path?.includes('/cosmos.gov.v1beta1.Query')) return;

    if (
      response.data?.result?.response?.log?.includes(
        `can't convert a gov/v1 Proposal to gov/v1beta1 Proposal`,
      )
    ) {
      await models.ChainNode.update(
        { cosmos_gov_version: CosmosGovernanceVersion.v1beta1Failed },
        { where: { id: chainNode.id } },
      );
    }
  };

  const updateV1NodeIfNeeded = async (req, response, chainNode) => {
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
  };
}

export default setupCosmosProxy;
