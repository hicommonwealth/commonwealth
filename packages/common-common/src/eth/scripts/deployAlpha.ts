import { providers } from 'ethers';
import Web3 from 'web3';

import {
  MPond__factory,
  TimelockMock__factory,
  GovernorAlphaMock__factory,
} from '../types';

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
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  // Deploy timelock
  const timelockFactory = new TimelockMock__factory(signer);
  const timelock = await timelockFactory.deploy(member, 2 * 60);

  // Deploy comp
  const mpondFactory = new MPond__factory(signer);
  const mpond = await mpondFactory.deploy(member, bridge);

  // Deploy Delegate
  const delegateFactory = new GovernorAlphaMock__factory(signer);
  const alpha = await delegateFactory.deploy(
    timelock.address,
    mpond.address,
    member
  );
  console.log(alpha.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
