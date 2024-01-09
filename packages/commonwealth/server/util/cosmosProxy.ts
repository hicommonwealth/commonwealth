import {
  AppError,
  cacheDecorator,
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
      'Content-Type, Authorization, Content-Length, X-Requested-With',
    );
    res.sendStatus(200);
  });

  app.use(
    '/magicCosmosAPI/:chain/?(node_info)?',
    bodyParser.text(),
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq,
    ),
    async (req, res) => {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      const chainNode = await models.ChainNode.findOne({
        where: { cosmos_chain_id: 'cosmoshub' },
      });
      const targetRestUrl = chainNode?.alt_wallet_url;
      const targetRpcUrl = chainNode?.url;
      log.trace(`Found cosmos endpoint: ${targetRestUrl}, ${targetRpcUrl}`);

      try {
        let response;
        if (req.method === 'POST') {
          if (
            req.body.method === 'abci_query' &&
            req.body.params.path === '/cosmos.auth.v1beta1.Query/Account'
          ) {
            const hexToStr = (hex) =>
              String.fromCharCode(
                ...hex.match(/.{1,2}/g).map((c) => parseInt(c, 16)),
              )
                .replace('-', '')
                .replace(/\n/g, '');

            // TODO: validate?
            const cosmosAddress = hexToStr(req.body.params.data);

            // magicCosmosAPI is CORS-approved for the magic iframe
            res.setHeader('Access-Control-Allow-Origin', '*');

            // TODO: stub out value, get block height
            response = {
              data: JSON.stringify({
                jsonrpc: '2.0',
                id: req.body.id,
                result: {
                  response: {
                    code: 0,
                    log: '',
                    info: '',
                    index: '0',
                    key: null,
                    value:
                      'ClcKIC9jb3Ntb3MuYXV0aC52MWJldGExLkJhc2VBY2NvdW50EjMKLWNvc21vczFyYXpsM2gyZWo0dDZrbmVqOGttd2R2Y2xraGV0ZHVyemp6Z211Yxjih20=',
                    proofOps: null,
                    height: '17101151',
                    codespace: '',
                  },
                },
              }),
            };
            res.setHeader('Content-Type', 'application/json');
          } else {
            response = await axios.post(targetRpcUrl, req.body, {
              headers: {
                origin: 'https://commonwealth.im/?magic_login_proxy=true',
              },
            });
          }
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
            2,
          )}`,
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
    },
  );
}

export default setupCosmosProxy;
