// Use https://admin.socket.io/#/ to monitor

import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui';
import { BrokerConfig } from 'rascal';
import * as jwt from 'jsonwebtoken';
import { createCeNamespace, publishToCERoom } from './chainEventsNs';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig'
import { JWT_SECRET } from '../config';

// since the websocket servers are not linked with the main Commonwealth server we do not send the socket.io client
// library to the user since we already import it + disable http long-polling to avoid sticky session issues
const io = new Server({ serveClient: false, transports: ['websocket'], cors: {
		origin: "http://localhost:8080", // TODO: change to commonwealth.im in prod/staging
		methods: ["GET", "POST"]
	}});

// this authentication middleware applies to ALL namespaces
io.use((socket, next) => {
	if (socket.handshake.query?.token) {
		jwt.verify(<string>socket.handshake.query.token, JWT_SECRET, (err, decodedUser) => {
			if (err) return next(new Error('Authentication Error: incorrect JWT token'));
			(<any>socket).user = decodedUser;
			next();
		})
	} else {
		next(new Error('Authentication Error: no JWT token given'))
	}
})

io.on('connection', (socket) => {
	console.log(`${socket.id} connected`)
	socket.on('disconnect', () => {
		console.log(`${socket.id} disconnected`);
	});
});

// start websocket server to generate Engine.IO instance
io.listen(3002)
console.log('Websocket server started on port', 3002)

io.engine.on('connection_error', (err) => {
	console.log(err.req);      // the request object
	console.log(err.code);     // the error code, for example 1
	console.log(err.message);  // the error message, for example "Session ID unknown"
	console.log(err.context);  // some additional error context
})

// create the chain-events namespace
const ceNamespace = createCeNamespace(io);

// enables the admin analytics dashboard (creates /admin namespace)
instrument(io, {
	auth: false,
})

const rabbitController = new RabbitMQController(<BrokerConfig>RabbitMQConfig)
rabbitController.init()
	.then(() => {
		return rabbitController.startSubscription(publishToCERoom.bind(ceNamespace), 'ChainEventsNotificationsSubscription')
	})

