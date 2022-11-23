import express, { Express, Request, Response } from "express";
import { SnapshotEvent } from "./types";
import { RabbitMqHandler } from "./rabbitMQ/eventHandler";
import {
  RascalPublications,
  RabbitMQController,
  getRabbitMQConfig,
} from "common-common/src/rabbitmq";
import { factory, formatFilename } from "common-common/src/logging";
import { RABBITMQ_URI } from "./config";
import fetchNewSnapshotProposal from "./utils/fetchSnapshot";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(express.json());

let controller: RabbitMQController;

app.get("/", (req: Request, res: Response) => {
  res.send("OK!");
});

app.post("/snapshot", async (req: Request, res: Response) => {
  try {
    const event: SnapshotEvent = req.body.event;
    if (!event) {
      res.status(500).send("Error sending snapshot event");
    }

    const parsedId = event.id.replace(/.*\//, "");
    const eventType = event.event.split("/")[1];
    console.log({ parsedId });
    const response = await fetchNewSnapshotProposal(parsedId);
    console.log(response.data.proposal.end);
    event.id = parsedId;
    event.title = response.data.proposal.title;
    event.body = response.data.proposal.body;
    event.choices = response.data.proposal.choices;
    event.space = response.data.proposal.space;
    event.start = response.data.proposal.start;
    event.expire = response.data.proposal.end;
    console.log({ event });

    await controller.publish(event, RascalPublications.SnapshotListener);
    res.status(200).send({ message: "Snapshot event received", event });
  } catch (err) {
    console.log(err);
    res.status(500).send("error: " + err);
  }
});

app.listen(port, async () => {
  const log = factory.getLogger(formatFilename(__filename));
  log.info(`⚡️[server]: Server is running at https://localhost:${port}`);

  try {
    controller = new RabbitMQController(getRabbitMQConfig(RABBITMQ_URI));
    controller.init();
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    log.error(`Error starting server: ${err}`);
  }
  app.bind;
});
