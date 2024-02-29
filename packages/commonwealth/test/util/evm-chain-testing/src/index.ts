import cors from 'cors';
import dotenv from 'dotenv';
import express, { json } from 'express';
import logger from 'morgan';
import setupRouter from './router';
dotenv.config();

const app = express();
const router = setupRouter();

app.use(cors());
app.options('*', cors());
app.use(logger('dev') as express.RequestHandler);

app.use(json() as express.RequestHandler);
app.use('/', router);
const port = process.env.CHAIN_PORT;
app.set('port', port);

app.listen(port, () => {
  console.log('Server started on port ' + port);
});
