import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

export const parseProposals = (
  proposals: IAaveProposalResponse[] | ICompoundProposalResponse[],
  searchTerm: string
): IAaveProposalResponse[] | ICompoundProposalResponse[] => {
  let sortedProposals: IAaveProposalResponse[] | ICompoundProposalResponse[];
  if (Number.isNaN(proposals[0].identifier)) {
    sortedProposals = proposals.sort();
  } else {
    sortedProposals = proposals.sort((a, b) => {
      return parseInt(b.identifier) - parseInt(a.identifier);
    });
  }
  return (
    // waiting on https://github.com/microsoft/TypeScript/pull/53489 to be released to remove this cast
    (
      sortedProposals as (IAaveProposalResponse | ICompoundProposalResponse)[]
    ).filter((prop) =>
      prop.identifier.toLowerCase().includes(searchTerm.toLowerCase())
    ) as IAaveProposalResponse[] | ICompoundProposalResponse[]
  );
};
