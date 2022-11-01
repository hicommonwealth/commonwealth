import * as Amqp from "amqp-ts";

export default async function consumeMessages(){
  // @TODO Set URL in environment variable
  const connection = new Amqp.Connection("amqp://localhost");
  connection.createChannel((err, channel) => {
    channel.assertQueue("hello", {durable: false});

    channel.consume("hello", (msg) => {
      console.log(" [x] Received %s", msg.content.toString());
    }, {noAck: true});
  });


  const q = await channel.assertQueue('snapsh_queue');

  await channel.bindQueue(q.queue, 'logExchange', 'Info');

  channel.consume(q.queue, (msg) => {
    const data = JSON.parse(msg.content);
    console.log(data);
    channel.ack(msg);
  })
}

