import axios from 'axios';
import type { Express } from 'express';
import url from 'url';

import { CE_URL } from '../config';
import { cacheDecorator } from 'common-common/src/cacheDecorator';
import { lookupKeyDurationInReq } from 'common-common/src/cacheKeyUtils';


async function calcCeProxyCacheKeyDuration(ceEndpoint: 'entities' | 'events', req, res, next) {
  const search = url.parse(req.url).search;
  const ceUrl = `${CE_URL}/${ceEndpoint}${search}`;

  req.cacheKey = ceUrl;
  req.cacheDuration = 60 * 5; // 5 minutes
  next();
}

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
  app.get('/api/ce/entities', calcCeProxyCacheKeyDuration.bind(null, 'entities'), cacheDecorator.cacheMiddleware(60*5, lookupKeyDurationInReq), ceProxy.bind(null, 'entities'));
  app.get('/api/ce/events', calcCeProxyCacheKeyDuration.bind(null, 'events'), cacheDecorator.cacheMiddleware(60*5, lookupKeyDurationInReq), ceProxy.bind(null, 'events'));
}

export default setupCEProxy;
