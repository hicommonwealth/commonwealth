/***
 * @file Mock server replicating the Graph Protocol graphql API.
 *
 * This file is designed to mock the Graph Protocol API by exposing a similar set of
 * features, including a similar query language (see: ProposalInput) and a Proposal type
 * with a minimal set of properties (id, processed, description).
 *
 * The proposal data is initialized with 5 proposals, id 0 thru 4, all marked processed. All
 * proposal data is stored in memory, and as such is not persisted across runs of the provider.
 *
 * Running the server via `yarn mock-graphql-provider` (or `ts-node server/test/mockGraphqlProvider.ts`)
 * exposes the following routes on localhost:4000:
 *   1. A graphql endpoint "/graphql" which includes the graphiql web interface for easy testing.
 *   2. A GET "/add" with optional argument "n", which produces n (default: 1) new proposals.
 *   3. A GET "/complete" with required argument "id", which marks that proposal as processed.
 *   4. A GET "/description" with required arguments "id" and "description", which updates the description
 *      of the proposal with corresponding id to the provided value.
 **/

import express from 'express';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import TestQueries from './chainObjectQueries';

const schema = buildSchema(`
  input ProposalInput {
    id: ID
    id_not: ID
    id_gt: ID
    id_lt: ID
    id_gte: ID
    id_lte: ID
    id_in: [ID!]
    id_not_in: [ID!]
    processed: Boolean
    description: String
  }

  type Proposal {
    id: ID!
    processed: Boolean
    description: String
  }

  type Query {
    proposals(where: ProposalInput): [Proposal!]!
  }
`);

const proposals = [...Array(5)].map((v, i) => ({ id: `${i}`, processed: true, description: `proposal ${i}`}));

const rootValue = {
  proposals: (request, response, params) => {
    const where = request.where;
    if (!where) {
      return proposals;
    }
    let results = proposals;
    if ('id' in where) {
      results = results.filter(({ id }) => id === where.id);
    }
    if ('id_not' in where) {
      results = results.filter(({ id }) => id !== where.id_not);
    }
    if ('id_gt' in where) {
      results = results.filter(({ id }) => +id > +where.id_gt);
    }
    if ('id_gte' in where) {
      results = results.filter(({ id }) => +id >= +where.id_gte);
    }
    if ('id_lt' in where) {
      results = results.filter(({ id }) => +id < +where.id_lt);
    }
    if ('id_lte' in where) {
      results = results.filter(({ id }) => +id <= +where.id_lte);
    }
    if ('id_in' in where) {
      results = results.filter(({ id }) => where.id_in.indexOf(id) !== -1);
    }
    if ('id_not_in' in where) {
      results = results.filter(({ id }) => where.id_not_in.indexOf(id) === -1);
    }
    if ('processed' in where) {
      results = results.filter(({ processed }) => processed === where.processed);
    }
    if ('description' in where) {
      results = results.filter(({ description }) => description === where.description);
    }
    return results;
  }
};

const app = express();
app.get('/info', (req, res, next) => {
  console.log('fetched mock info');
  return res.json({ success: true, n: proposals.length, version: TestQueries.version });
});

app.get('/add', (req, res, next) => {
  let n = 1;
  if (req.query && req.query.n) {
    n = +req.query.n;
  }

  const nProposals = proposals.length;
  const added = [];
  for (let i = 0; i < n; ++i) {
    proposals.push({
      id: `${i + nProposals}`,
      processed: false,
      description: `proposal ${i + nProposals}`
    });
    added.push(i + nProposals);
  }
  console.log(`added ${n} new proposals: ${JSON.stringify(added)}`);
  return res.json({ success: true, added_ids: added });
});

app.get('/complete', (req, res, next) => {
  if (!req.query || !req.query.id) {
    return next(new Error('no id found'));
  }
  const id = +req.query.id;
  if (id < 0 || id >= proposals.length) {
    return next(new Error('invalid id'));
  }
  if (proposals[id].processed) {
    return next(new Error('already completed'));
  }
  proposals[id].processed = true;
  console.log(`marked proposal ${id} completed`);
  return res.json({ success: true });
});

app.get('/description', (req, res, next) => {
  if (!req.query) {
    return next(new Error('no args found'));
  }
  if (!req.query.id) {
    return next(new Error('no id found'));
  }
  if (!req.query.description) {
    return next(new Error('no description found'));
  }
  const id = +req.query.id;
  if (id < 0 || id >= proposals.length) {
    return next(new Error('invalid id'));
  }
  if (proposals[id].processed) {
    return next(new Error('proposal already completed'));
  }
  proposals[id].description = req.query.description;
  console.log(`updated proposal ${id} description`);
  return res.json({ success: true });
});

app.use('/graphql', graphqlHTTP({ schema, rootValue }));
app.listen(4000);
console.log('Running mock GraphQL server at http://localhost:4000/graphql');
