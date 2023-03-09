import { ethers, providers } from 'ethers';
import BravoABI from '../eth/artifacts/contracts/Compound/GovernorBravoImmutable.sol/GovernorBravoImmutable.json';
import CompABI from '../eth/artifacts/contracts/Compound/MPond.sol/MPond.json';
import { ProposalState } from '../src/chains/compound/types';
import { timeTravel } from './utils/timeTravel';

async function main() {
  if (!process.argv[2]) {
    console.warn('Must provide the Governor Bravo contract address');
    return;
  }

  const Web3 = (await import('web3')).default;
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

  console.log(`Time Traveling:`);
  await timeTravel(provider, Number(process.argv[2]));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
