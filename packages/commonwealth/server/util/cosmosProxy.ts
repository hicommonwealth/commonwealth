import axios from 'axios';
import bodyParser from 'body-parser';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

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
import chain from 'server/models/chain';

const log = factory.getLogger(formatFilename(__filename));
const defaultCacheDuration = 60 * 10; // 10 minutes

async function getChainNode(req, res, next) {
  try {
    const chain = await req.models.Chain.findOne({
      where: { id: req.params.chain },
      include: req.models.ChainNode,
    });
    if (!chain) {
      throw new AppError('Invalid chain');
    }
    req.chain = chain;
    next(null, chain);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

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
    async (req, res, next) => {
      try {
        const chain = await models.Chain.findOne({
          where: { id: req.params.chain },
          include: models.ChainNode,
        });
        if (!chain) {
          throw new AppError('Invalid chain');
        }
        req.chain = chain;
        next();
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
    async (req, res, next) => {
      await createProxyMiddleware({
        target: req.chain.ChainNode.url,
        pathRewrite: { [req.url]: '/' },
        onProxyReq: fixRequestBody,
      });
      next();
    },
    async function cosmosProxy(req, res) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        // log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        // const chain = await models.Chain.findOne({
        //   where: { id: req.params.chain },
        //   include: models.ChainNode,
        // });
        // if (!chain) {
        //   throw new AppError('Invalid chain');
        // }
        // log.trace(`Found cosmos endpoint: ${chain.ChainNode.url}`);
        console.log('req.url', req.url);
        const response = await axios.post(req.chain.ChainNode.url, req.body, {
          headers: {
            origin: 'https://commonwealth.im',
          },
        });
        log.trace(
          // `Got response from endpoint:`
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

  // for gov v1 queries.
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
}

export default setupCosmosProxy;
