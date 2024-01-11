import {
  cacheDecorator,
  lookupKeyDurationInReq,
} from '@hicommonwealth/adapters';
import axios from 'axios';
import type { Express } from 'express';

const defaultCacheDuration = 24 * 60 * 60; // 1 day

function setupIpfsProxy(app: Express) {
  app.get(
    '/api/ipfsProxy',
    calcIpfsCacheKeyDuration,
    cacheDecorator.cacheMiddleware(
      defaultCacheDuration,
      lookupKeyDurationInReq,
    ),
    async function (req, res) {
      try {
        const hash = req.query.hash;
        const isImageRequest = req.query?.image === 'true';
        const response = await axios.get(
          `https://cloudflare-ipfs.com/ipfs/${hash}#x-ipfs-companion-no-redirect`,
          {
            headers: {
              origin: 'https://commonwealth.im',
            },
            timeout: 5000,
            responseType: isImageRequest ? 'arraybuffer' : 'json',
          },
        );
        const contentType = response.headers['content-type'];
        if (contentType) {
          res.setHeader('Content-Type', contentType);
        }
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
  );
}

function calcIpfsCacheKeyDuration(req, res, next) {
  if (req.query?.image === 'true') {
    req.cacheDuration = null; // not not cache images
    return next();
  }

  req.cacheDuration = 24 * 60 * 60; // cache for 1 day
  req.cacheKey = `/api/ipfsProxy_${req.query.hash}`;
  return next();
}

export default setupIpfsProxy;
