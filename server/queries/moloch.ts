export default {
  version: {
    id: 'MolochProposalv1',
    chain: 'moloch',
    unique_identifier: 'id',
    completion_field: 'processed',
  },
  queries: [
    {
      object_type: 'MolochProposalv1',
      query_type: 'INIT',
      active: true,
      description: 'fetches all moloch proposals, run only once',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      query: `{
        proposals {
          id
          details
          timestamp
          proposalIndex
          startingPeriod
          processed
          didPass
          aborted
        }
      }`,
    },
    {
      object_type: 'MolochProposalv1',
      query_type: 'ADD',
      active: true,
      description: 'fetches all unprocessed moloch proposals, used to update active proposal state',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      query: `{
        proposals(where: { processed: false }) {
          id
          details
          timestamp
          proposalIndex
          startingPeriod
          processed
          didPass
          aborted
        }
      }`,
    },
    {
      object_type: 'MolochProposalv1',
      query_type: 'UPDATE',
      active: true,
      description: 'fetches all processed moloch proposals that we still have marked active',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      query: `{
        proposals(where: { id_in: %s, processed: true }) {
          id
          details
          timestamp
          proposalIndex
          startingPeriod
          processed
          didPass
          aborted
        }
      }`,
    },
  ]
};
