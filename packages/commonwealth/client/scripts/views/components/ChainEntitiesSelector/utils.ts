import ChainEntity from 'models/ChainEntity';
import { chainEntityTypeToProposalName } from 'identifiers';

export const sortChainEntities = (a: ChainEntity, b: ChainEntity) => {
  if (!a.threadId && b.threadId) {
    return -1;
  }

  if (a.threadId && !b.threadId) {
    return 1;
  }

  return 0;
};

export const filterChainEntities = (ce: ChainEntity, searchTerm: string) => {
  if (ce.typeId.startsWith('0x')) {
    return false;
  }

  return (
    ce.typeId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    ce.title?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    chainEntityTypeToProposalName(ce.type)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
};
