console.log('LOADING src/services/commonProtocol/abi/feeManagerAbi.ts START');
export const feeManagerABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'beneficiary',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'getBeneficiaryBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

console.log('LOADING src/services/commonProtocol/abi/feeManagerAbi.ts END');
