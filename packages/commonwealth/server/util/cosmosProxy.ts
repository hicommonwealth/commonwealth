import {
  AppError,
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
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
const defaultCacheDuration = 60 * 10; // 10 minutes

function setupCosmosProxy(
  app: Express,
  models: DB,
  cacheDecorator: CacheDecorator,
) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.post(
    '/cosmosAPI/:chain',
    bodyParser.text(),
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Community.findOne({
          where: { id: req.params.chain },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError('Invalid chain');
        }
        log.trace(`Found cosmos endpoint: ${chain.ChainNode.url}`);
        const response = await axios.post(chain.ChainNode.url, req.body, {
          headers: {
            origin: 'https://commonwealth.im',
          },
        });
        log.trace(
          `Got response from endpoint: ${JSON.stringify(
            response.data,
            null,
            2,
          )}`,
        );
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
  );

  // for gov v1 queries.
  app.use(
    '/cosmosLCD/:chain',
    bodyParser.text(),
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq,
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Community.findOne({
          where: { id: req.params.chain },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError('Invalid chain');
        }
        const targetUrl = chain.ChainNode?.alt_wallet_url;
        if (!targetUrl) {
          throw new AppError('No LCD endpoint found');
        }
        log.trace(`Found cosmos endpoint: ${targetUrl}`);
        const rewrite = req.originalUrl.replace(req.baseUrl, targetUrl);
        const body = _.isEmpty(req.body) ? null : req.body;

        const response = await axios.post(rewrite, body, {
          headers: {
            origin: 'https://commonwealth.im',
          },
        });
        log.trace(
          `Got response from endpoint: ${JSON.stringify(
            response.data,
            null,
            2,
          )}`,
        );
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
  );

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
