import {
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import { AppError, NodeHealth, logger } from '@hicommonwealth/core';
import { DB } from '@hicommonwealth/model';
import axios from 'axios';
import bodyParser from 'body-parser';
import { Express } from 'express';
import _ from 'lodash';
import {
  calcCosmosLCDCacheKeyDuration,
  calcCosmosRPCCacheKeyDuration,
} from './cosmosCache';

const log = logger().getLogger(__filename);
const DEFAULT_CACHE_DURATION = 60 * 10; // 10 minutes
const FALLBACK_NODE_DURATION = +process.env.FALLBACK_NODE_DURATION_S || 300; // 5 min
const Errors = {
  NeedCosmosChainId: 'cosmos_chain_id is required',
};

function setupCosmosProxy(
  app: Express,
  models: DB,
  cacheDecorator: CacheDecorator,
) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.post(
    '/cosmosAPI/:community_id',
    bodyParser.text(),
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      let cosmos_chain_id, chainNodeUrl, previouslyFailed;
      try {
        const chainParam = req.params.chain;
        const chain = await models.Community.findOne({
          where: { id: chainParam },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError(`Invalid chain: ${chainParam}`);
        }

        let response;
        const chainNode = chain.ChainNode;
        chainNodeUrl = chainNode?.url?.trim();
        let useProxy = !chainNodeUrl;
        cosmos_chain_id = chainNode?.cosmos_chain_id;
        previouslyFailed = chainNode?.health === NodeHealth.Failed;
        if (previouslyFailed) {
          const lastUpdate = chainNode?.updated_at?.getTime();
          const healthPauseTimeout = new Date(
            lastUpdate + FALLBACK_NODE_DURATION,
          );
          useProxy = previouslyFailed && new Date() > healthPauseTimeout;
        }

        if (chainNodeUrl && !useProxy) {
          log.trace(`Found cosmos endpoint: ${chainNodeUrl}`);
          response = await axios
            .post(chainNodeUrl, req.body, {
              headers: {
                origin: 'https://commonwealth.im',
              },
            })
            .catch(async (err) => {
              log.trace(`Error: ${err.message}`);
              await flagFailedNode(
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

        log.trace(
          `Got response from endpoint: ${JSON.stringify(
            response.data,
            null,
            2,
          )}`,
        );

        return res.send(response.data);
      } catch (err) {
        await flagFailedNode(
          previouslyFailed,
          cosmos_chain_id,
          chainNodeUrl,
          err,
        );
        res.status(500).json({
          message: err.message,
        });
      }
    },
  );

  /**
   *  For Cosmos REST requests, we use the alt_wallet_url which is an LCD enpdpoint.
   *  Used for Cosmos chains that use v1 of the gov module.
   */
  app.use(
    '/cosmosAPI/v1/:chain',
    bodyParser.text(),
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      DEFAULT_CACHE_DURATION,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.info(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      let cosmos_chain_id, chainNodeRestUrl, previouslyFailed;
      try {
        const chainParam = req.params.chain;
        const chain = await models.Community.findOne({
          where: { id: chainParam },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError(`Invalid chain: ${chainParam}`);
        }

        let response;
        const chainNode = chain.ChainNode;
        cosmos_chain_id = chainNode?.cosmos_chain_id;
        chainNodeRestUrl = chainNode?.alt_wallet_url?.trim();
        let useProxy = !chainNodeRestUrl;
        previouslyFailed = chainNode?.health === NodeHealth.Failed;

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
              log.trace(`Error: ${err.message}`);
              await flagFailedNode(
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

        log.trace(`Got response: ${JSON.stringify(response.data, null, 2)}`);
        return res.send(response.data);
      } catch (err) {
        await flagFailedNode(
          previouslyFailed,
          cosmos_chain_id,
          chainNodeRestUrl,
          err,
        );
        res.status(500).json({
          message: err.message,
        });
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
    if (!cosmos_chain_id) {
      throw new AppError(Errors.NeedCosmosChainId);
    }
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
    previouslyFailed: boolean,
    cosmos_chain_id: string,
    failedUrl: string,
    error?: any,
  ) => {
    if (error?.message === Errors.NeedCosmosChainId) return; // not a health issue
    if (previouslyFailed) return; // no need to hit db again
    if (!cosmos_chain_id) {
      throw new AppError(Errors.NeedCosmosChainId);
    }

    const failedChainNode = await models.ChainNode.findOne({
      where: { cosmos_chain_id },
    });
    if (!failedChainNode) return;

    failedChainNode.health = NodeHealth.Failed;
    await failedChainNode.save();
    log.trace(
      `Problem with endpoint ${failedUrl}.
       Marking node as 'failed' for ${FALLBACK_NODE_DURATION} seconds.
      ${JSON.stringify(error)}`,
    );
  };

  const flagHealthyNode = async (
    response,
    previouslyFailed: boolean,
    cosmos_chain_id: string,
    dbUrl: string,
  ) => {
    // update if the request was successfully made to the DB URL
    // and the node was previously marked as failed
    if (dbUrl?.includes(response.request.host) && previouslyFailed) {
      if (!cosmos_chain_id) {
        throw new AppError(Errors.NeedCosmosChainId);
      }
      const healthyChainNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id },
      });
      if (!healthyChainNode) return;
      healthyChainNode.health = NodeHealth.Healthy;
      await healthyChainNode.save();
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
    bodyParser.text(),
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
        log.trace(
          `Got response from endpoint: ${JSON.stringify(
            response.data,
            null,
            2,
          )}`,
        );

        // magicCosmosAPI is CORS-approved for the magic iframe
        res.setHeader('Access-Control-Allow-Origin', 'https://auth.magic.link');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        return res.send(response.data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
      }
    },
  );
}

export default setupCosmosProxy;
