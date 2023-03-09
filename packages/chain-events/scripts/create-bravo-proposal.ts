import { BigNumber, ethers, providers } from 'ethers';
import { JsonRpcSigner } from '@ethersproject/providers';
import BravoABI from '../eth/artifacts/contracts/Compound/GovernorBravoImmutable.sol/GovernorBravoImmutable.json';
import CompABI from '../eth/artifacts/contracts/Compound/MPond.sol/MPond.json';
import { ProposalState } from '../src/chains/compound/types';
import { timeTravel } from './utils/timeTravel';

async function createProposal(signer: JsonRpcSigner, bravo: any, comp: any) {
  console.log('Creating Proposal:');
  // const proposalMinimum = await bravo.proposalThreshold();
  const delegateAmount = BigNumber.from(10).pow(19);
  const delegateTxnSigner = await comp.delegate(
    signer._address,
    delegateAmount,
    { from: signer._address }
  );
  const delegateTxnAddr = await comp.delegate(process.argv[4], delegateAmount, {
    from: signer._address,
  });
  console.log(
    `\tDelegated ${ethers.utils.formatUnits(delegateAmount, 18)} COMP to ${
      signer._address
    } in block ${(await delegateTxnSigner.wait()).blockNumber}`
  );
  console.log(
    `\tDelegated ${ethers.utils.formatUnits(delegateAmount, 18)} COMP to ${
      process.argv[4]
    } in block ${(await delegateTxnAddr.wait()).blockNumber}`
  );

  const targets = ['0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'];
  const values = [BigNumber.from(0)];
  const signatures = ['_setCollateralFactor(address,uint256)'];
  const calldatas = [
    '0x000000000000000000000000C11B1268C1A384E55C48C2391D8D480264A3A7F40000000000000000000000000000000000000000000000000853A0D2313C0000',
  ];
  const description = 'test description';

  const proposalTxn = await bravo.propose(
    targets,
    values,
    signatures,
    calldatas,
    description,
    {
      from: signer._address,
    }
  );
  console.log(
    `\tProposal created in block: ${(await proposalTxn.wait()).blockNumber}`
  );

  const activeProposals = await bravo.latestProposalIds(signer._address);
  const state = await bravo.state(activeProposals);
  console.log(`\tLatest proposal id = ${activeProposals}`);
  console.log(`\tLatest proposal state = ${ProposalState[state]}\n`);
}

async function startProposal(
  provider: providers.JsonRpcProvider,
  bravo: any,
  from: string
) {
  console.log('Time travelling until the proposal is active:');
  const activeProposals = await bravo.latestProposalIds(from);
  const { startBlock } = await bravo.proposals(activeProposals);
  const currentBlock = await provider.getBlockNumber();
  console.log(`\tCurrent block = ${currentBlock}`);
  const blockDelta = startBlock.sub(currentBlock).add(1);
  await timeTravel(provider, blockDelta);
}

async function main() {
  if (!process.argv[2]) {
    console.warn('Must provide the Governor Bravo contract address');
    return;
  }

  if (!process.argv[3]) {
    console.warn('Must provide the COMP token contract address');
    return;
  }

  if (!process.argv[4]) {
    console.warn('Must provide an address to delegate to');
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

  const addresses: string[] = await provider.listAccounts();
  const [member, bridge] = addresses;
  const signer = provider.getSigner(member);

  const bravo = new ethers.Contract(process.argv[2], BravoABI.abi, signer);
  const comp = new ethers.Contract(process.argv[3], CompABI.abi, signer);

  await createProposal(signer, bravo, comp);
  await startProposal(provider, bravo, signer._address);

  console.log('Re-checking proposal state:');
  const activeProposals = await bravo.latestProposalIds(signer._address);
  const state = await bravo.state(activeProposals);
  console.log(`\tLatest proposal id = ${activeProposals}`);
  console.log(`\tLatest proposal state = ${ProposalState[state]}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
