import axios from 'axios';
import { factory, formatFilename } from 'common-common/src/logging';
import type { Express } from 'express';
import url from 'url';

import { ENTITIES_URL } from '../config';
const log = factory.getLogger(formatFilename(__filename));

function setupEntityProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.get('/api/entities', async function entityProxy(req, res, next) {
    log.info(`Got request: ${JSON.stringify(req.query, null, 2)}`);
    try {
      const search = url.parse(req.url).search;
      console.log(search);
      const entitiesUrl = `${ENTITIES_URL}/entities${search}`;
      console.log(entitiesUrl);
      const response = await axios.get(entitiesUrl, {
        headers: {
          origin: 'https://commonwealth.im'
        }
      });
      log.info(`Got response from endpoint: ${JSON.stringify(response.data, null, 2)}`);
      return res.send(response.data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

export default setupEntityProxy;
