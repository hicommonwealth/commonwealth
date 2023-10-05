```
// We need to be able to automatically update our OAS definition anytime a route is changes in code. (We also need version control.)

import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

const options = {
  swaggerDefinition: {
    info: {
      title: 'API',
      version: '0.0.2',
      description: 'Commonwealth API documentation',
    },
  },
  apis: ['./server/routes/*.ts'],  // (needs to recurse over routes directory)
};

const specs = swaggerJsdoc(options);

app.use('/oas', swaggerUi.serve, swaggerUi.setup(specs));  // Swagger currently set up at '/docs' 








```