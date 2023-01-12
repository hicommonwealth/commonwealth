import axios from 'axios';
import type { Express } from 'express';

function setupIpfsProxy(app: Express) {
  // using bodyParser here because cosmjs generates text/plain type headers
  app.get('/api/ipfsProxy', async function cosmosProxy(req, res) {
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
