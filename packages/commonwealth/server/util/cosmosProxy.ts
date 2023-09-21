import axios from 'axios';
import bodyParser from 'body-parser';
import _ from 'lodash';

import { AppError } from 'common-common/src/errors';
import type { Express } from 'express';
import type { DB } from '../models';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  calcCosmosLCDCacheKeyDuration,
  calcCosmosRPCCacheKeyDuration,
} from './cosmosCache';
import { lookupKeyDurationInReq } from 'common-common/src/cacheKeyUtils';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { bech32 } from 'bech32';

const log = factory.getLogger(formatFilename(__filename));
const defaultCacheDuration = 60 * 10; // 10 minutes

function setupCosmosProxy(app: Express, models: DB) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.post(
    '/cosmosAPI/:chain',
    bodyParser.text(),
    calcCosmosRPCCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Chain.findOne({
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
            2
          )}`
        );
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );

  // for gov v1 queries
  app.use(
    '/cosmosLCD/:chain',
    bodyParser.text(),
    calcCosmosLCDCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Chain.findOne({
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
            2
          )}`
        );
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );

  // cosmos-api proxies for the magic link iframe
  // - POST / for node info
  // - GET /node_info for fetching chain status (used by magic iframe, and magic login flow)
  // - GET /auth/accounts/:address for fetching address status (use by magic iframe)
  app.options('/magicCosmosAPI/:chain', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Private-Network', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
    res.send(200);
  });
  app.use(
    '/magicCosmosAPI/:chain/?(node_info)?',
    bodyParser.text(),
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq
    ),
    async (req, res) => {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Chain.findOne({
          where: { id: req.params.chain },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError('Invalid chain');
        }
        let targetRestUrl = chain.ChainNode?.alt_wallet_url;
        let targetRpcUrl = chain.ChainNode?.url;
        if (!targetRestUrl && !targetRpcUrl) {
          const fallback = await models.Chain.findOne({
            where: { id: 'osmosis' },
            include: models.ChainNode,
          });
          targetRestUrl = fallback.ChainNode.alt_wallet_url;
          targetRpcUrl = fallback.ChainNode.url;
        }
        log.trace(`Found cosmos endpoint: ${targetRestUrl}, ${targetRpcUrl}`);

        let response;
        if (req.method === 'POST') {
          response = await axios.post(targetRpcUrl, req.body, {
            headers: {
              origin: 'https://commonwealth.im/?magic_login_proxy=true',
            },
          });
        } else {
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
            2
          )}`
        );

        // magicCosmosAPI is CORS-approved for the magic iframe
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        return res.send(response.data);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
      }
    }
  );
  app.get(
    '/magicCosmosAPI/:chain/auth/accounts/:address',
    bodyParser.text(),
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq
    ),
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chain = await models.Chain.findOne({
          where: { id: req.params.chain },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError('Invalid chain');
        }
        let targetUrl = chain.ChainNode?.alt_wallet_url;
        if (!targetUrl) {
          const fallback = await models.Chain.findOne({
            where: { id: 'osmosis' },
            include: models.ChainNode,
          });
          targetUrl = fallback.ChainNode.alt_wallet_url;
        }
        log.trace(`Found cosmos endpoint: ${targetUrl}`);
        // special case: rewrite cosmos- prefix to chain specific prefix
        // either the requested chain or osmo, if we're using the fallback
        const { words } = bech32.decode(req.params.address);
        const rewrittenAddress = bech32.encode(
          chain.ChainNode?.alt_wallet_url ? chain.bech32_prefix : 'osmo',
          words
        );
        const rewrite = req.originalUrl
          .replace(req.baseUrl, targetUrl)
          .replace(req.params.address, rewrittenAddress)
          .replace(`/magicCosmosAPI/${req.params.chain}`, '');

        const response = await axios.get(rewrite, {
          headers: {
            origin: 'https://commonwealth.im',
          },
        });
        log.trace(
          `Got response from endpoint: ${JSON.stringify(
            response.data,
            null,
            2
          )}`
        );
        // magic expects a cosmos-sdk/Account, because their signer is still on launchpad:
        // https://github.com/cosmos/cosmjs/issues/702
        if (response?.data?.result?.type === 'cosmos-sdk/BaseAccount') {
          response.data.result.type = 'cosmos-sdk/Account';
          response.data.result.value = {
            address: rewrittenAddress,
            public_key: { type: 'tendermint/PubKeySecp256k1', value: '' },
            account_number: '0',
            sequence: '0',
          };
        }

        // magicCosmosAPI is CORS-approved for the magic iframe
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );
}

export default setupCosmosProxy;
