## How do I access the correct RabbitMQ Management dashboard?
The answer depends on which RabbitMQ instance is being used:
  - Locally install RabbitMQ
    - http://localhost:15672/
  - Local Docker RabbitMQ
    - http://127.0.0.1:15672/
  - Remote Vultr RabbitMQ
    - Combine the `VULTR_IP` env var with the `VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT` env var e.g. http://45.32.87.222:40837/
  - Staging/Production-env CLOUDAMQP Plugin
    - Access the management panel by going to the Resources tab on the Heroku App dashboard. Select the CLOUDAMQP resource and in the window that opens select the RabbitMQ Management button.
