import cors from 'cors';
import express, { json } from 'express';
import logger from 'morgan';
import { CHAIN_TEST_APP_PORT } from '../config';
import setupRouter from './router';

const app = express();
const router = setupRouter();

app.use(cors());
app.options('*', cors());
app.use(logger('dev') as express.RequestHandler);

app.use(json() as express.RequestHandler);
app.use('/', router);
const port = CHAIN_TEST_APP_PORT;
app.set('port', port);

app.listen(port, () => {
  console.log('Server started on port ' + port);
});
