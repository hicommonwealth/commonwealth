export const rabbitMQ = {
	 url : process.env.AMQP_URI || 'amqp://localhost',
	 exchangeName: 'logExchange',
}
