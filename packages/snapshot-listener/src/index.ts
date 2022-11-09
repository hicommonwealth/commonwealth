import express, { Express, Request, Response } from "express";
import { SnapshotEvent } from "./types";
import { RabbitMqHandler } from "./rabbitMQ/eventHandler";
import { RascalPublications } from "common-common/src/rabbitmq";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("OK!");
});

app.post("/snapshot", async (req: Request, res: Response) => {
  try {
    const event: SnapshotEvent = req.body.event;
    if (!event) {
      res.status(500).send("Error sending snapshot event");
    }
    const rabbitMqHandler = new RabbitMqHandler(
      JSON.parse(process.env.RABBITMQ_CONFIG),
      RascalPublications.SnapshotListener
    );

    await rabbitMqHandler.handle(event);

  } catch (err) {
    console.log(err);

    res.status(500).send("error: " + err);
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
