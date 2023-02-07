import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import externalSwagger from '../swagger/swagger_external.json';
import { SERVER_URL } from '../config';

export function addSwagger(endpoint: string, app: Express) {
  const urlParts = SERVER_URL.split('://');
  externalSwagger.host = `api.${urlParts[1]}`;
  externalSwagger.schemes = [urlParts[0]];
  app.use(endpoint, swaggerUi.serve, swaggerUi.setup(externalSwagger));
}
