import { providers } from 'ethers';

import {
  GovernorBravoImmutable__factory,
  MPond__factory,
  TimelockMock__factory,
} from '../types';

async function main() {
  // TODO: configure URL based on chain
  const Web3 = (await import('web3')).default;
  const web3Provider = new Web3.default.providers.WebsocketProvider(
    'http://localhost:8545',
    {
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 10,
        onTimeout: true,
      },
    },
  );
  const provider = new providers.Web3Provider(web3Provider as any);
  // 12s minute polling interval (default is 4s)
  provider.pollingInterval = 12000;
  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  // Deploy timelock
  const timelockFactory = new TimelockMock__factory(signer);
  const timelock = await timelockFactory.deploy(member, 2 * 60);

  // Deploy comp
  const compFactory = new MPond__factory(signer);
  const comp = await compFactory.deploy(member, bridge);

  // Deploy Delegate
  const delegateFactory = new GovernorBravoImmutable__factory(signer);
  const bravo = await delegateFactory.deploy(
    timelock.address,
    comp.address,
    member,
    4, // 4 blocks voting period
    1, // 1 block voting delay
    1, // 1 vote proposal threshold
  );
  await bravo._initiate();
  console.log(bravo.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
