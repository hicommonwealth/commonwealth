import { Client, Message, IntentsBitField } from 'discord.js';
import amqp from 'amqplib';

const discordToken = '';
const rabbitMQUrl = 'amqp://127.0.0.1';

const client = new Client({
    intents:
    [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages
    ]
});
const connectionPromise = amqp.connect(rabbitMQUrl);

client.on('ready', () => {
  console.log('Discord bot is ready.');
});

client.on('messageCreate', async (message: Message) => {
    // 1. First we filter for designated forum channels
    const channel = client.channels.cache.get(message.channelId)
    if(channel?.type !== 11) return // must be thread channel
    const parent_id = channel.parentId ?? '0'
    // Only process messages from relevant channels
    const relevantChannels = ['1121158376471142480']; // parentId of resolved channel data must point to this
    if (!relevantChannels.includes(parent_id)) return;
    
    // 2. Figure out if message is comment or thread
    const new_message = {
        user:{
            id: message.author.id,
            username: message.author.username
        },
        title: '', // If title is nothing == comment. channel_id will correspond to the thread channel id. 
        content: message.content,
        channel_id: message.channelId,
        parent_channel_id: parent_id
    }

    if(!message.nonce){
        const forum_post_title = channel.name
        const forum_post_content = message.content
        console.log(`New forum Post: ${forum_post_title} with content: ${forum_post_content}`)
        new_message.title = forum_post_title 
    }else{
        const parent_post = channel.name
        const comment = message.content
        console.log(`New comment on ${parent_post}: ${comment}`)
    }

    // 3. Publish the message to RabbitMQ queue
    const connection = await connectionPromise;
    const rmqChannel = await connection.createChannel();
    await rmqChannel.assertQueue('incomingDiscordMessage');
    await rmqChannel.sendToQueue('incomingDiscordMessage', Buffer.from(JSON.stringify(new_message)));
    console.log('Message published to RabbitMQ:', message.content);
});

client.login(discordToken);