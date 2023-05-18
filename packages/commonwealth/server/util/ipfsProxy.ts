import axios from 'axios';
import type { Express } from 'express';
import { cacheDecorator } from 'common-common/src/cacheDecorator';

function setupIpfsProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  // caching for 1 day
  app.get(
    '/api/ipfsProxy',
    cacheDecorator.cacheMiddleware(
      24 * 60 * 60,
      (req) => `/api/ipfsProxy_${req.query.hash}`
    ),
    async function (req, res) {
      try {
        const hash = req.query.hash;
        const response = await axios.get(
          `https://cloudflare-ipfs.com/ipfs/${hash}#x-ipfs-companion-no-redirect`,
          {
            headers: {
              origin: 'https://commonwealth.im',
            },
            timeout: 5000,
          }
        );
        return res.send(response.data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  );
}

export default setupIpfsProxy;
