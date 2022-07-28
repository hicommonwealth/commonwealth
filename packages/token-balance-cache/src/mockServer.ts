import express, { Request, Response } from "express";
import bodyParser from 'body-parser';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

require('dotenv').config();

const port = process.env.PORT || 4001;

const app = express();
const router = express.Router();

async function main() {

  // setup server
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));

  router.post('/getBalance', async (req: Request, res: Response) => {
    const { chain_node_id, addresses, contract_address, contract_type } = req.body;
    if (!chain_node_id || !+chain_node_id || !addresses) {
      return res.status(400).json('Request must contain chain_node_id and addresses');
    }

    const addressArray = addresses.split(',');
    const results = {};

    for (const address of addressArray) {
      // edit this
      if (address == '0x0000000000000000000000000000000000000000')
        results[address] = '1000000000000';
      else if (address == '0x1111111111111111111111111111111111111111')
        results[address] = "0000000000000";
      else
        // default value
        results[address] = '100000'
    }
    return res.status(200).json(results);
  });

  router.post('/getNodes', async (req: Request, res: Response) => {
    const nodes = [
      { name: "ethereum", description: "", chain_node_id: 37 },
      { name: "edgeware", description: "", chain_node_id: 45 }
    ]

    return res.status(200).json(nodes)
  });

  app.use('/', router);
  app.set('port', port);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        log.error(`Port ${port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  app.on('error', onError);
  app.listen(port, () => {
    log.info(`Token Balance server listening on port ${port}`);
  });
}

main();
