import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import externalSwagger from '../swagger/swagger_external.json';

export function addSwagger(endpoint: string, app: Express) {
  app.use(endpoint, swaggerUi.serve, swaggerUi.setup(externalSwagger));
}
