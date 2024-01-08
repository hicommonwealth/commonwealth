import axios from 'axios';
import bodyParser from 'body-parser';
import _ from 'lodash';

import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { lookupKeyDurationInReq } from 'common-common/src/cacheKeyUtils';
import { AppError } from 'common-common/src/errors';
import type { Express } from 'express';
import type { DB } from '../models';
import {
  calcCosmosLCDCacheKeyDuration,
  calcCosmosRPCCacheKeyDuration,
} from './cosmosCache';

const log = loggerFactory.getLogger(formatFilename(__filename));
const defaultCacheDuration = 60 * 10; // 10 minutes

function setupCosmosProxy(app: Express, models: DB) {
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
}

export default setupCosmosProxy;
