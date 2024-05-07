import cors from 'cors';
import express, { json } from 'express';
import pinoHttp from 'pino-http';
import { CHAIN_TEST_APP_PORT } from './config';
import setupRouter from './router';

const app = express();
const router = setupRouter();

app.use(
  pinoHttp({
    quietReqLogger: false,
    transport: {
      target: 'pino-http-print',
      options: {
        destination: 1,
        all: false,
        colorize: true,
        relativeUrl: true,
        translateTime: 'HH:MM:ss.l',
      },
    },
  }),
);

app.use(cors());
app.options('*', cors());

app.use(json() as express.RequestHandler);
app.use('/', router);
const port = CHAIN_TEST_APP_PORT;
app.set('port', port);

app.listen(port, () => {
  console.log('Server started on port ' + port);
});
