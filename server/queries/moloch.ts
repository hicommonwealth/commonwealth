export default {
  version: {
    id: 'MolochProposalv1',
    chain: 'moloch',
    unique_identifier: 'id',
    completion_field: 'processed',
    type: 'dao',
  },
  queries: [
    {
      object_type: 'MolochProposalv1',
      query_type: 'INIT',
      active: true,
      description: 'fetches all moloch proposals, run only once',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      //query_url: 'http://localhost:8000/subgraphs/name/moloch',
      has_pagination: true,
      query: `{
        proposals(first: %d, skip: %d) {
          id
          timestamp
          proposalIndex
          startingPeriod
          delegateKey
          applicantAddress
          tokenTribute
          sharesRequested
          yesVotes
          noVotes
          processed
          status
          votes {
            timestamp
            uintVote
            member {
              id
              delegateKey
              shares
              highestIndexYesVote
              tokenTribute
            }
          }
          details
        }
      }`,
    },
    {
      object_type: 'MolochProposalv1',
      query_type: 'ADD',
      active: true,
      description: 'fetches all unprocessed moloch proposals, used to update active proposal state',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      //query_url: 'http://localhost:8000/subgraphs/name/moloch',
      has_pagination: true,
      query: `{
        proposals(first: %d, skip: %d, where: { processed: false }) {
          id
          timestamp
          proposalIndex
          startingPeriod
          delegateKey
          applicantAddress
          tokenTribute
          sharesRequested
          yesVotes
          noVotes
          processed
          status
          votes {
            timestamp
            uintVote
            member {
              id
              delegateKey
              shares
              highestIndexYesVote
              tokenTribute
            }
          }
          details
        }
      }`,
    },
    {
      object_type: 'MolochProposalv1',
      query_type: 'UPDATE',
      active: true,
      description: 'fetches all processed moloch proposals that we still have marked active',
      query_url: 'https://api.thegraph.com/subgraphs/name/molochventures/moloch',
      //query_url: 'http://localhost:8000/subgraphs/name/moloch',
      has_pagination: true,

      // NOTE: query here has a "%s" for id_in, which allows us to control which proposals
      //   are "asking for updates" based on which haven't yet been marked processed.
      query: `{
        proposals(first: %d, skip: %d, where: { id_in: %s, processed: true }) {
          id
          timestamp
          proposalIndex
          startingPeriod
          delegateKey
          applicantAddress
          tokenTribute
          sharesRequested
          yesVotes
          noVotes
          processed
          status
          votes {
            timestamp
            uintVote
            member {
              id
              delegateKey
              shares
              highestIndexYesVote
              tokenTribute
            }
          }
          details
        }
      }`,
    },
  ]
};
