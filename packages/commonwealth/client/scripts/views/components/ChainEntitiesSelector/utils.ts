import ChainEntity from 'models/ChainEntity';
import { chainEntityTypeToProposalName } from 'identifiers';

export const filterChainEntities = (ce: ChainEntity, searchTerm: string) => {
  if (ce.typeId.startsWith('0x')) {
    return false;
  }

  return (
    ce.typeId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    chainEntityTypeToProposalName(ce.type)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
};
