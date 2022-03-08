import type { Express } from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';

import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

function setupCosmosProxy(app: Express, models: DB) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.post(
    '/cosmosAPI/:chain',
    bodyParser.text(),
    async function cosmosProxy(req, res, next) {
      log.trace(`Got request: ${JSON.stringify(req.body, null, 2)}`);
      try {
        log.trace(`Querying cosmos endpoint for chain: ${req.params.chain}`);
        const chainNode = await models.ChainNode.findOne({
          where: {
            chain: req.params.chain,
          },
        });
        if (!chainNode) {
          throw new Error('Invalid chain');
        }
        log.trace(`Found cosmos endpoint: ${chainNode.url}`);
        const response = await axios.post(chainNode.url, req.body, {
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
