import express, { Express, Request, Response } from "express";
import { Producer, SnapshotEvent } from "./producer";
import dotenv from "dotenv";
dotenv.config();

const producer = new Producer();
const app = express();
const port = process.env.PORT;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("OK!");
});

app.post("/snapshot", async (req: Request, res: Response) => {
  try {
    const event: SnapshotEvent = req.body.event;
    await producer.publishMessage("snapshot", event);

    res.status(201).send("Snapshot event sent:" + JSON.stringify(event));
  } catch (err) {
    console.log(err);

    res.status(500).send("error: " + err);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
