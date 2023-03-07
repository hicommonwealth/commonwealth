import axios from 'axios';
import type { Express } from 'express';
import url from 'url';

import { ENTITIES_URL } from '../config';

function setupEntityProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.get('/api/entities', async function entityProxy(req, res) {
    try {
      const search = url.parse(req.url).search;
      const entitiesUrl = `${ENTITIES_URL}/entities${search}`;
      const response = await axios.get(entitiesUrl, {
        headers: {
          origin: 'https://commonwealth.im',
        },
      });
      return res.send(response.data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

export default setupEntityProxy;
