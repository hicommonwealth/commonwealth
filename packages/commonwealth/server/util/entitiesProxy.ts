import axios from 'axios';
import type { Express } from 'express';
import url from 'url';

import { CE_URL } from '../config';

async function ceProxy(ceEndpoint: 'entities' | 'events', req, res) {
  try {
    const search = url.parse(req.url).search;
    const ceUrl = `${CE_URL}/${ceEndpoint}${search}`;
    const response = await axios.get(ceUrl, {
      headers: {
        origin: 'https://commonwealth.im',
      },
    });
    return res.send(response.data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

function setupCEProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.get('/api/ce/entities', ceProxy.bind(null, 'entities'));
  app.get('/api/ce/events', ceProxy.bind(null, 'events'));
}

export default setupCEProxy;
