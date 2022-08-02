import express, { Request, Response } from "express";
import { factory, formatFilename } from 'common-common/src/logging'
import bodyParser from 'body-parser'
import passport from "passport";
import setupPassport from "./passport";

const log = factory.getLogger(formatFilename(__filename));

const port = process.env.PORT || 4002;

const app = express();
const router = express.Router();

setupPassport();

async function main() {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(passport.initialize());

  router.get('/test', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
    return res.status(200).json({success: true})
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
    log.info(`Chain events server listening on port ${port}`);
  });
}

main();
