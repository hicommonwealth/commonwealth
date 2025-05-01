import {
  CacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import axios from 'axios';
import type { Router } from 'express';
import { registerRoute } from '../middleware/methodNotAllowed';

const defaultCacheDuration = 60; // 1 minute

function setupUniswapProxy(router: Router, cacheDecorator: CacheDecorator) {
  // Handle OPTIONS preflight requests
  router.options('/uniswapProxy', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.sendStatus(200);
  });

  registerRoute(
    router,
    'get',
    '/uniswapProxy',
    calcUniswapCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq,
    ),
    async function (req, res) {
      try {
        // request looks like: /uniswapProxy?path=${apiPath}?${outparams}
        const [, proxiedCommand] = req.url.split('path=');

        // Make the request to Uniswap API
        const response = await axios.get(
          `https://api.uniswap.org/v1/${proxiedCommand}`,
          {
            headers: {
              origin: process.env.SERVER_URL || 'https://commonwealth.im',
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
        );

        // Set appropriate CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization',
        );

        // Return the response data
        return res.send(response.data);
      } catch (err) {
        console.error('Uniswap proxy error:', err);
        res.status(err.response?.status || 500).json({
          message: err.message,
          details: err.response?.data,
        });
      }
    },
  );

  registerRoute(router, 'post', '/uniswapProxy', async function (req, res) {
    try {
      // Get the endpoint and path from the query params
      const endpoint = (req.query.endpoint as string) || '';
      const path = (req.query.path as string) || 'quote';

      // Make the request to Uniswap API
      const response = await axios.post(
        `https://api.uniswap.org/v1/${path}${endpoint ? '/' + endpoint : ''}`,
        req.body,
        {
          headers: {
            origin: process.env.SERVER_URL || 'https://commonwealth.im',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      // Set appropriate CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization',
      );

      // Return the response data
      return res.send(response.data);
    } catch (err) {
      console.error('Uniswap proxy error:', err);
      res.status(err.response?.status || 500).json({
        message: err.message,
        details: err.response?.data,
      });
    }
  });
}

function calcUniswapCacheKeyDuration(req, res, next) {
  req.cacheDuration = 60; // cache for 1 minute
  const queryString = new URLSearchParams(
    req.query as Record<string, string>,
  ).toString();
  req.cacheKey = `/api/uniswapProxy_${queryString}`;
  return next();
}

export default setupUniswapProxy;
