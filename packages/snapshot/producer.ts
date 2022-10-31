import * as Amqp from "amqp-ts";
import { rabbitMQ } from "./config";

class Producer {
  channel!: Amqp.Queue;
  exchange!: Amqp.Exchange;

  async create() {
    try {
      const connection = new Amqp.Connection(rabbitMQ.url);
      this.channel = connection.declareQueue("snapshot_queue", {
        durable: true,
      });
      this.exchange = connection.declareExchange(
        rabbitMQ.exchangeName,
        "direct",
        { durable: true }
      );
      this.channel.bind(this.exchange);

      await connection.completeConfiguration();
    } catch (err) {
      console.log(err);
    }
  }

  async publishMessage(routingKey: string, message: string) {
    if (!this.channel) {
      await this.create();
    }

    try {
      const amqpMessage = new Amqp.Message(JSON.stringify(message));
      this.exchange.send(amqpMessage, routingKey);

      console.log(`[x] Sent ${routingKey}: ${message}`);
    } catch (err) {
      console.log(err);
    }
  }
}

export { Producer };
