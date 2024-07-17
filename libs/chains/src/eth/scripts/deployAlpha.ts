import { providers } from 'ethers';

import {
  GovernorAlphaMock__factory,
  MPond__factory,
  TimelockMock__factory,
} from '../types';

async function main() {
  const Web3 = (await import('web3')).default;
  // TODO: configure URL based on chain
  const web3Provider = new Web3.providers.WebsocketProvider(
    'http://localhost:8545',
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
    member,
  );
  console.log(alpha.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
