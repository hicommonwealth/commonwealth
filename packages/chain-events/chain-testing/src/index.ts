import express, { json } from 'express';
import dotenv from 'dotenv';
import setupRouter from './router';
dotenv.config();

const app = express();
const router = setupRouter();

app.use(json());
app.use('/', router);
const port = process.env.CHAIN_PORT;
app.set('port', port);

app.listen(port, () => {
  console.log('Server started on port ' + port);
});
