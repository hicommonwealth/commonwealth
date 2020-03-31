export default {
  version: {
    id: 'TestProposalv1',
    chain: 'test',
    unique_identifier: 'id',
    completion_field: 'processed',
  },
  queries: [
    {
      object_type: 'TestProposalv1',
      query_type: 'INIT',
      active: true,
      description: 'fetches all proposals, run only once',
      query_url: 'http://localhost:4000/graphql',
      query: `{
        proposals {
          id
          description
          processed
        }
      }`,
    },
    {
      object_type: 'TestProposalv1',
      query_type: 'ADD',
      active: true,
      description: 'fetches all unprocessed proposals, used to update active proposal state',
      query_url: 'http://localhost:4000/graphql',
      query: `{
        proposals(where: { processed: false }) {
          id
          description
          processed
        }
      }`,
    },
    {
      object_type: 'TestProposalv1',
      query_type: 'UPDATE',
      active: true,
      description: 'fetches all processed proposals that we still have marked active',
      query_url: 'http://localhost:4000/graphql',
      query: `{
        proposals(where: { id_in: %s, processed: true }) {
          id
          description
          processed
        }
      }`,
    },
  ]
};
