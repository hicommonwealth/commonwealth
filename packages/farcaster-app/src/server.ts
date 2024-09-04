import express from 'express';
import farcasterRouter from './router';

const PORT =
  typeof process.env.PORT !== 'undefined'
    ? parseInt(process.env.PORT, 10)
    : 3001;

const app = express();

app.use('/', farcasterRouter);

app.listen(PORT, () => {
  console.log(`Farcaster app listening on ${PORT}`);
});
