import cwModels from '../../commonwealth/server/database';

import { BigNumber, ethers, providers } from 'ethers';
import {
  GovernorBravoImmutable,
  GovernorBravoImmutable__factory as GovernorBravoImmutableFactory,
  MPond,
  MPond__factory as MPondFactory,
  TimelockMock__factory as TimelockFactory,
} from '../src/contractTypes';
import { JsonRpcSigner } from '@ethersproject/providers';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from 'common-common/src/types';
import { BIGINT } from 'sequelize';

async function deployGovBravo(
  signer: JsonRpcSigner,
  member: string,
  bridge: string
): Promise<{ comp: MPond; bravo: GovernorBravoImmutable }> {
  console.log('Deploying Governor Bravo to Hardhat:');

  // deploy timelock
  const timelockFactory = new TimelockFactory(signer);
  const timelock = await timelockFactory.deploy(member, 2 * 60);

  // deploy comp
  const mPondFactory = new MPondFactory(signer);
  const comp = await mPondFactory.deploy(member, bridge);

  // deploy delegate
  const factory = new GovernorBravoImmutableFactory(signer);
  const bravo = await factory.deploy(
    timelock.address,
    comp.address,
    member,
    60,
    1,
    1
  );

  await bravo.setInitialProposalId();

  console.log('\tCOMP token deployed at:', comp.address);
  console.log('\tGovernor Bravo deployed at:', bravo.address);

  const totalSupply = await comp.totalSupply();
  console.log('\tCOMP Total Supply:', ethers.utils.formatUnits(totalSupply));

  // transfer COMP to the give address
  await comp.transfer(process.argv[2], BigNumber.from(10).pow(21));
  await comp.transfer(
    '0xCC8D47D441D1e2b477B322C9243f814D8A609808',
    BigNumber.from(10).pow(21)
  );

  const balance = await comp.balanceOf(process.argv[2]);
  console.log(
    `\t${process.argv[2]} COMP Balance:`,
    ethers.utils.formatUnits(balance, 18)
  );

  console.log();
  return { comp, bravo };
}

async function sendEthers(signer: JsonRpcSigner, address: string) {
  const amount = '10';
  console.log(`Transferring ${amount} ETH to ${address}:`);
  const data = {
    from: signer._address,
    to: address,
    value: ethers.utils.parseEther(amount),
  };

  try {
    const txn = await signer.sendTransaction(data);
    const receipt = await txn.wait();
    if (receipt && receipt.status === 1) {
      console.log('\tTransfer Successful!\n');
      return receipt;
    } else throw new Error('Transaction failed!');
  } catch (e) {
    console.error(e);
    console.log();
    return;
  }
}

async function findOrCreateChainAndChainNode() {
  console.log('Finding or creating the ChainNode and Chain:');
  // findOrCreate doesn't work when passing 'id'
  let chainNode = await cwModels.ChainNode.findOne({
    where: {
      url: 'ws://127.0.0.1:8545',
      eth_chain_id: 31337,
      balance_type: BalanceType.Ethereum,
    },
  });

  if (!chainNode) {
    console.log('\tNo ChainNode found for hardhat. Creating a ChainNode...');
    chainNode = await cwModels.ChainNode.create({
      url: 'ws://127.0.0.1:8545',
      eth_chain_id: 31337,
      balance_type: BalanceType.Ethereum,
      name: 'Hardhat Local',
    });
  } else console.log('\tChainNode found!');

  let chain = await cwModels.Chain.findOne({
    where: { id: 'hardhat-local', chain_node_id: chainNode.id },
  });

  if (!chain) {
    console.log('\tNo Chain found for hardhat. Creating a Chain...');
    chain = await cwModels.Chain.create({
      id: 'hardhat-local',
      name: 'Hardhat Testing Community',
      default_symbol: 'COMP',
      active: true,
      has_chain_events_listener: true,
      network: ChainNetwork.Compound,
      base: ChainBase.Ethereum,
      custom_stages: 'true',
      chain_node_id: chainNode.id,
      ce_verbose: true,
      type: ChainType.DAO,
      token_name: 'comp',
    });

    console.log('\tCreating new community roles...');
    await cwModels.CommunityRole.bulkCreate([
      {
        chain_id: 'hardhat-local',
        name: 'member',
        allow: BigInt('0'),
        deny: BigInt('0'),
      },
      {
        chain_id: 'hardhat-local',
        name: 'admin',
        allow: BigInt('0'),
        deny: BigInt('0'),
      },
      {
        chain_id: 'hardhat-local',
        name: 'moderator',
        allow: BigInt('0'),
        deny: BigInt('0'),
      },
    ]);
  } else console.log('\tChain found!');

  console.log();
  return { chain, chainNode };
}

async function findOrCreateDbContracts(
  chainNodeId: number,
  contractAddress: string
) {
  console.log(
    'Finding or creating the database contract and community contract:'
  );
  const [contract, created] = await cwModels.Contract.findOrCreate({
    where: {
      chain_node_id: chainNodeId,
      address: contractAddress,
      decimals: 18,
      symbol: 'COMP',
      type: 'compound',
      is_factory: false,
    },
  });
  if (created) console.log(`\tDatabase contract created!`);
  else console.log(`\tDatabase contract found!`);

  const [communityContract, created2] =
    await cwModels.CommunityContract.findOrCreate({
      where: {
        chain_id: 'hardhat-local',
        contract_id: contract.id,
      },
    });
  if (created2) console.log(`\tCommunity contract created!`);
  else console.log(`\tCommunity contract found!`);

  console.log();
  return { contract, communityContract };
}

async function main() {
  if (!process.argv[2]) {
    console.warn('Must provide an address to send tokens to');
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

  await sendEthers(signer, process.argv[2]);
  await sendEthers(signer, '0xCC8D47D441D1e2b477B322C9243f814D8A609808');

  const { comp, bravo } = await deployGovBravo(signer, member, bridge);

  const { chain, chainNode } = await findOrCreateChainAndChainNode();
  await findOrCreateDbContracts(chainNode.id, bravo.address);

  console.log('Next Steps:');
  console.log('\tStart chain-events using: CHAIN=hardhat-local yarn start-all');
  console.log(
    `\tOnce chain-events is up create a proposal: yarn create-bravo-proposal ${bravo.address} ${comp.address} ${process.argv[2]}\n`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
