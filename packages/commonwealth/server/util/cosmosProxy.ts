import axios from 'axios';
import bodyParser from 'body-parser';

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
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );

  // two cosmos-api proxies for the magic link iframe
  // - node_info for fetching chain status (used by magic iframe, and magic login flow)
  // - auth/accounts/:address for fetching address status (use by magic iframe)
  app.use(
    '/magicCosmosAPI/:chain/node_info',
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
        // TODO: test for other chains
        // rpcUrl: app.chain?.meta?.node?.url || app.config.chains.getById('osmosis').node.url,
        const targetUrl = chain.ChainNode?.alt_wallet_url;
        if (!targetUrl) {
          throw new AppError('No LCD endpoint found');
        }
        log.trace(`Found cosmos endpoint: ${targetUrl}`);

        const response = await axios.get(targetUrl + '/node_info', {
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

        // special case: support magic iframe + commonwealth clients (including custom domains)
        // this is a single route and should be easy to cache
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(response.data);
      } catch (err) {
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
        // TODO: test for other chains
        // rpcUrl: app.chain?.meta?.node?.url || app.config.chains.getById('osmosis').node.url,
        const targetUrl = chain.ChainNode?.alt_wallet_url;
        if (!targetUrl) {
          throw new AppError('No LCD endpoint found');
        }
        log.trace(`Found cosmos endpoint: ${targetUrl}`);
        // special case: rewrite cosmos- prefix to chain specific prefix
        const { words } = bech32.decode(req.params.address);
        const rewrittenAddress = bech32.encode(chain.bech32_prefix, words);
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
        // magic expects a cosmos-sdk/Account, while lcd endpoints usually return
        // cosmos-sdk/BaseAccount. this seems to be a launchpad vs stargate issue:
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

        // special case: magicCosmosAPI is CORS-approved for the magic iframe
        res.setHeader('Access-Control-Allow-Origin', 'https://auth.magic.link');
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );
}

export default setupCosmosProxy;
