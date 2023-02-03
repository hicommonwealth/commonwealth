import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { SERVER_URL } from '../config';
import externalSwagger from '../swagger/swagger_external.json';

export function addSwagger(endpoint: string, app: Express) {
  // redirect from commonwealthapp.herokuapp.com to commonwealth.im
  const urlParts = SERVER_URL.split('://');
  externalSwagger.host = urlParts[1];

  if (externalSwagger.host.includes('commonwealthapp.herokuapp.com')) {
    externalSwagger.host = 'comomonwealth.im';
  } else if (
    externalSwagger.host.includes('commonwealth-staging2.herokuapp.com')
  ) {
    externalSwagger.host = 'affinity.fun';
  }

  externalSwagger.schemes = [urlParts[0]];
  app.use(endpoint, swaggerUi.serve, swaggerUi.setup(externalSwagger));
}
