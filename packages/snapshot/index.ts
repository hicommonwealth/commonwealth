import express, { Express, Request, Response } from 'express';
import { Producer } from './producer';
import dotenv from 'dotenv';
dotenv.config();

const producer = new Producer();
const app = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('OK!');
});


app.post('/snapshot', async (req: Request, res: Response) => {
  await producer.publishMessage('snapshot', 'snapshot');
  res.send('snapshot event');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
