import amqp, { Message } from 'amqplib/callback_api'

const createMQConsumer = (amqpUrl: string, queueName: string) => {
  console.log('Connecting to RabbitMQ...')
  return () => {
    amqp.connect(amqpUrl, (errConn, conn) => {
      if (errConn) {
        console.log('Error connecting to RabbitMQ: ', errConn)
        throw errConn
      }

      conn.createChannel((errCh, ch) => {
        if (errCh) {
          console.log('Error creating channel: ', errCh)
          throw errCh
        }

        ch.assertQueue(queueName, { durable: true })
        ch.consume(queueName, (msg: Message | null ) => {
          console.log('Consume message from RabbitMQ...')
          //do ssomething with the msg 
        })
      })
    })
  }
}

export default createMQConsumer
