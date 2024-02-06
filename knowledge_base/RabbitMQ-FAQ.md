## How do I access the correct RabbitMQ Management dashboard?

The answer depends on which RabbitMQ instance is being used:

- Locally install RabbitMQ
  - <http://localhost:15672/>
- Local Docker RabbitMQ
  - <http://127.0.0.1:15672/>
- Staging/Production-env CLOUDAMQP Plugin
  - Access the management panel by going to the Resources tab on the Heroku App dashboard. Select the CLOUDAMQP resource and in the window that opens select the RabbitMQ Management button.