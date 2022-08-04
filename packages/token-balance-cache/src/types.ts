const ContractTypes = ['erc20', 'erc721', 'spl-token'] as const;
export type ContractType = typeof ContractTypes[number];
export function parseContractType(arg: string): ContractType {
  const ct = ContractTypes.find((validName) => validName === arg);
  if (ct) return ct;
  throw new Error('Invalid contract type');
}