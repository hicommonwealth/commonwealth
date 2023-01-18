import { providers } from 'ethers';
import Web3 from 'web3';

import { Token__factory as TokenFactory } from '../types';

async function main() {
  // TODO: configure URL based on chain
  const web3Provider = new Web3.providers.WebsocketProvider(
    'http://localhost:8545',
    {
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 10,
        onTimeout: true,
      },
    }
  );

  const provider = new providers.Web3Provider(web3Provider as any);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
  const addresses: string[] = await provider.listAccounts();
  const [member] = addresses;
  const signer = provider.getSigner(member);

  // deploy voting token and mint 100 tokens
  const factory = new TokenFactory(signer);
  const token = await factory.deploy('1000');
  console.log(token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
