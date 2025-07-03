import Web3 from 'web3';

export const anvilAccounts: { address: string; privateKey: string }[] = [
  {
    address: '0xeae51cd2055b8e6F381b0A1688FE84E459A63bB6',
    privateKey:
      '0xee381817fb43be969236690d1a6e6a3d8d21ffca7feaabc634e38bc9eb11dafb',
  },
  {
    address: '0x99f544eA102c90924249F9169a9275B70469E13e',
    privateKey:
      '0x7faaff01df3c99f28f738e12e0e78c4d03dc04eba5c52495c007f3c158b05f5d',
  },
  {
    address: '0x5c60a7D9265FF034F52221dBAA7dE78dBa1f6c31',
    privateKey:
      '0xb3428f59a49e1d2b12a868a138319893abe7487c0c5eed8ee7d443e8174f90da',
  },
  {
    address: '0x6Ec51543EC61460924a2FD71c78CE4941bC118c8',
    privateKey:
      '0x1a0e63ecc28b4595bb0856450193003626967d25b7130ac2c1453db84917ca22',
  },
  {
    address: '0x52acC856D7AF34AEbc6865d901b2F3Cd09469c89',
    privateKey:
      '0x15db9a3840976214c8f48e5a5b724f93479b8b651af3efa8eec929178a7e258c',
  },
  {
    address: '0xf65E463072363b61Ea978206253Ff23d5ac509eF',
    privateKey:
      '0xd0f01e25afb76cfb2add3c52a420e38d4e7d5dd9cfe2c3870a1aa296120447f6',
  },
  {
    address: '0x73dB3832ce7bc307Eb6858Cdb6CD8b4D6873A079',
    privateKey:
      '0x2ff8b9e791eb613331a219337a79431b53889fdd6d4a9402ca65bf0427624da5',
  },
  {
    address: '0x38f955d10d829c1CF78dC216325D86Eb1cF03230',
    privateKey:
      '0x642438559a31203963a86f9b18dbf263fcc2b53a242442c6b067bac9003bd3a9',
  },
  {
    address: '0xf21C91c73F13e36feDbb58f87A052Ef3A578bccf',
    privateKey:
      '0x5fcd94d22981f9c89c255f67814b617babd8d4591f94717f349f071e3b0f5a5c',
  },
  {
    address: '0x636aD2Ca468CA9012a360a9e87F9F0c34F779B88',
    privateKey:
      '0xb7770d1ef75d29c51387506488b3257085bbc7f579df0d438d7348bf790c3fc4',
  },
];

export function setupWeb3(anvilPort: number) {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(`http://127.0.0.1:${anvilPort}`),
  );

  anvilAccounts.forEach((a) => {
    web3.eth.accounts.wallet.add(a.privateKey);
  });

  return web3;
}
