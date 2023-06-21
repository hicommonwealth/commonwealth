import amqp from 'amqplib';

const rabbitMQUrl = 'amqp://127.0.0.1';
const connectionPromise = amqp.connect(rabbitMQUrl);

async function consumeMessages() {
const connection = await connectionPromise;
const channel = await connection.createChannel();
await channel.assertQueue('incomingDiscordMessage');
await channel.consume('incomingDiscordMessage', (message) => {
if (message !== null) {
    const messageContent = message.content.toString();
    const parsedMessage = JSON.parse(messageContent);

    channel.ack(message);
}
});
}

consumeMessages()
