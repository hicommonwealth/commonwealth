import { GraphQLClient } from 'graphql-request';
import { config } from './config';
import { getSdk } from './generated/graphql';

const client = new GraphQLClient('https://backboard.railway.app/graphql/v2', {
  headers: {
    authorization: `Bearer ${config.RAILWAY_TOKEN}, // if needed`,
  },
});

const sdk = getSdk(client);

export async function deployReviewApp() {
  // const x =
}
