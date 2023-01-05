import type { Express } from 'express';
import axios from 'axios';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

function setupIpfsProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.get('/api/ipfsProxy', async function cosmosProxy(req, res, next) {
    try {
      const hash = req.query.hash;
      const response = await axios.get(
        `https://cloudflare-ipfs.com/ipfs/${hash}#x-ipfs-companion-no-redirect`,
        {
          headers: {
            origin: 'https://commonwealth.im',
          },
        }
      );
      return res.send(response.data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

export default setupIpfsProxy;
