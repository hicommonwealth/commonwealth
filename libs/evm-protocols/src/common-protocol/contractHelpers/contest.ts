import {
  ContestGovernorAbi,
  ContestGovernorSingleAbi,
  FeeManagerAbi,
  INamespaceAbi,
  NamespaceFactoryAbi,
} from '@commonxyz/common-protocol-abis';
import {
  EvmEventSignatures,
  decodeLog,
  factoryContracts,
} from '@hicommonwealth/evm-protocols';
import { CONTEST_FEE_PERCENT, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { Mutex } from 'async-mutex';
import {
  Chain,
  HttpTransport,
  PublicClient,
  TransactionReceipt,
  getContract,
} from 'viem';
import {
  EvmProtocolChain,
  getPublicClient,
  getWalletClient,
  mapToAbiRes,
} from '../utils';
import { getNamespace } from './namespace';

export const getTotalContestBalance = async (
  contestAddress: string,
  client: PublicClient<HttpTransport, Chain>,
  oneOff?: boolean,
): Promise<string> => {
  const contestContract = getContract({
    address: contestAddress as `0x${string}`,
    abi: oneOff ? ContestGovernorSingleAbi : ContestGovernorAbi,
    client,
  });

  let feeManagerAddressPromise: Promise<`0x${string}`> | undefined;
  if (!oneOff) {
    feeManagerAddressPromise = contestContract.read.FeeMangerAddress();
  }

  const { 0: contestToken, 1: feeManagerAddress } = await Promise.all([
    contestContract.read.contestToken(),
    feeManagerAddressPromise,
  ]);

  let beneficiaryBalancePromise: Promise<bigint> | undefined;
  if (!oneOff && feeManagerAddress) {
    beneficiaryBalancePromise = client.readContract({
      address: feeManagerAddress,
      abi: FeeManagerAbi,
      functionName: 'getBeneficiaryBalance',
      args: [contestAddress as `0x${string}`, contestToken],
    });
  }

  let contestBalancePromise: Promise<bigint>;
  if (contestAddress === ZERO_ADDRESS) {
    contestBalancePromise = client.getBalance({
      address: contestAddress,
    });
  } else {
    contestBalancePromise = client.readContract({
      address: contestToken,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          inputs: [{ type: 'address', name: 'account' }],
          outputs: [{ type: 'uint256', name: '' }],
          stateMutability: 'view',
        },
      ] as const,
      functionName: 'balanceOf',
      args: [contestAddress as `0x${string}`],
    });
  }

  const { 0: contestBalance, 1: beneficiaryBalance } = await Promise.all([
    contestBalancePromise,
    beneficiaryBalancePromise,
  ]);

  const balance = beneficiaryBalance
    ? contestBalance + beneficiaryBalance
    : contestBalance;

  return balance.toString();
};

/**
 * Gets relevant contest state information
 * @param chain
 * @param contest the address of the contest
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns Contest Status object
 */
export const getContestStatus = async (
  chain: EvmProtocolChain,
  contest: string,
  oneOff: boolean = false,
): Promise<{
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
}> => {
  const client = getPublicClient(chain);
  const contract = {
    address: contest as `0x${string}`,
    abi: oneOff ? ContestGovernorSingleAbi : ContestGovernorAbi,
  };

  const promise = await client.multicall({
    contracts: [
      {
        ...contract,
        functionName: 'startTime',
      },
      {
        ...contract,
        functionName: 'endTime',
      },
      {
        ...contract,
        functionName: 'currentContentId',
      },
      {
        ...contract,
        functionName: oneOff ? 'contestLength' : 'contestInterval',
      },
    ],
    allowFailure: false,
  });

  return {
    startTime: Number(promise[0]),
    endTime: Number(promise[1]),
    contestInterval: Number(promise[2]),
    lastContentId: String(promise[3]),
  };
};

/**
 * Get the total balance of a given contest
 * @param chain
 * @param contest the address of contest to get the balance of
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns a numeric contest balance of the contestToken in wei(ie / 1e18 for decimal value)
 */
export const getContestBalance = async (
  chain: EvmProtocolChain,
  contest: string,
  oneOff: boolean = false,
): Promise<string> => {
  return await getTotalContestBalance(contest, getPublicClient(chain), oneOff);
};

/**
 * Gets vote and more information about winners of a given contest
 * @param chain
 * @param contest the address of the contest
 * @param prizePercentage the prize percentage of the contest
 * @param payoutStructure the payout structure of the contest
 * @param contestId the id of the contest for data within the contest contract.
 * No contest id will return current winners
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns Contest balance and ContestScores object containing equal indexed content ids, addresses, and votes
 */
export const getContestScore = async (
  chain: EvmProtocolChain,
  contest: string,
  prizePercentage: number,
  payoutStructure: number[],
  contestId?: number,
  oneOff: boolean = false,
): Promise<{
  contestBalance: string | null;
  scores: {
    content_id: string;
    creator_address: string;
    votes: string;
    prize: string;
  }[];
}> => {
  const client = getPublicClient(chain);
  const contestInstance = getContract({
    address: contest as `0x${string}`,
    abi: oneOff ? ContestGovernorSingleAbi : ContestGovernorAbi,
    client,
  });

  const { 0: winnerIds, 1: contestBalance } = await Promise.all([
    oneOff
      ? contestInstance.read.getWinnerIds()
      : contestInstance.read.getPastWinners([BigInt(contestId!)]),
    getContestBalance(chain, contest, oneOff),
  ]);

  if (winnerIds.length == 0) {
    console.warn(
      `getContestScore WARN: No winners found for contest ID (${contestId}) on contest address: ${contest}`,
    );
    return { contestBalance, scores: [] };
  }

  const contract = {
    address: contest as `0x${string}`,
    abi: ContestGovernorAbi,
    functionName: 'content',
  } as const;
  const multicallContracts: {
    address: `0x${string}`;
    abi: typeof ContestGovernorAbi;
    functionName: 'content';
    args: [BigInt];
  }[] = winnerIds.map((w) => ({
    ...contract,
    args: [w],
  }));
  const contentMeta = await client.multicall({
    contracts: multicallContracts,
    allowFailure: false,
  });

  const scores = winnerIds.map((v, i) => {
    const parsedMeta = mapToAbiRes(
      ContestGovernorAbi,
      'content',
      contentMeta[i],
    );
    return {
      winningContent: v,
      winningAddress: parsedMeta.creator,
      voteCount: parsedMeta.cumulativeVotes,
    };
  });

  let prizePool =
    (BigInt(contestBalance) *
      (oneOff ? BigInt(100) : BigInt(prizePercentage))) /
    BigInt(100);
  prizePool = (prizePool * BigInt(100 - CONTEST_FEE_PERCENT)) / BigInt(100); // deduct contest fee from prize pool
  return {
    contestBalance,
    scores: scores.map((s, i) => ({
      content_id: s.winningContent.toString(),
      creator_address: s.winningAddress,
      votes: BigInt(s.voteCount).toString(),
      prize:
        i < Number(payoutStructure.length)
          ? ((prizePool * BigInt(payoutStructure[i])) / BigInt(100)).toString()
          : '0',
    })),
  };
};

export type AddContentResponse = {
  txReceipt: TransactionReceipt;
  contentId: string;
};

/**
 * Adds content to an active contest. Includes validation of contest state
 * @param client
 * @param contest the address of the contest
 * @param creator the address of the user to create content on behalf of
 * @param url the common/commonwealth url of the content
 * @param nonce The nonce of the transaction
 * @returns txReceipt and contentId of new content (NOTE: this should be saved for future voting)
 */
export const addContent = async (
  client: ReturnType<typeof getWalletClient>,
  contest: string,
  creator: string,
  url: string,
  nonce?: number,
): Promise<AddContentResponse> => {
  let txReceipt: TransactionReceipt;
  try {
    const { request } = await client.simulateContract({
      abi: ContestGovernorSingleAbi,
      address: contest as `0x${string}`,
      functionName: 'addContent',
      args: [creator as `0x${string}`, url, '0x'],
      ...(await client.estimateFeesPerGas()),
      gas: BigInt(1_000_000),
      nonce,
    });
    txReceipt = await client.getTransactionReceipt({
      hash: await client.writeContract(request),
    });
  } catch (e) {
    throw new Error('Failed to push content to chain: ' + e);
  }

  const contentAddedEvent = txReceipt.logs.find(
    (l) => l.topics[0] === EvmEventSignatures.Contests.ContentAdded,
  );

  if (!contentAddedEvent) {
    throw new Error('Content not added on-chain');
  }

  const { args } = decodeLog({
    abi: ContestGovernorAbi,
    eventName: 'ContentAdded',
    data: contentAddedEvent.data,
    topics: contentAddedEvent.topics,
  });

  return {
    txReceipt,
    contentId: args.contentId.toString(),
  };
};

/**
 * Adds a vote to content if voting power is available and user hasnt voted
 * @param client
 * @param contest the address of the contest
 * @param voter the address of the voter
 * @param contentId The contentId on the contest to vote
 * @param nonce The nonce of the transaction
 * @returns a tx receipt
 */
export const voteContent = async (
  client: ReturnType<typeof getWalletClient>,
  contest: string,
  voter: string,
  contentId: string,
  nonce?: number,
): Promise<TransactionReceipt> => {
  let txReceipt: TransactionReceipt;
  try {
    const { request } = await client.simulateContract({
      abi: ContestGovernorSingleAbi,
      address: contest as `0x${string}`,
      functionName: 'voteContent',
      args: [voter as `0x${string}`, BigInt(contentId)],
      ...(await client.estimateFeesPerGas()),
      gas: BigInt(1_000_000),
      nonce,
    });
    txReceipt = await client.getTransactionReceipt({
      hash: await client.writeContract(request),
    });
  } catch (error) {
    throw new Error('Failed to put vote on-chain: ' + error);
  }

  return txReceipt;
};

const nonceMutex = new Mutex();

export const addContentBatch = async ({
  chain,
  privateKey,
  contest,
  creator,
  url,
}: {
  chain: EvmProtocolChain;
  privateKey: string;
  contest: string[];
  creator: string;
  url: string;
}): Promise<PromiseSettledResult<AddContentResponse>[]> => {
  return await nonceMutex.runExclusive(async () => {
    const client = getWalletClient({
      ...chain,
      private_key: privateKey,
    });

    let currNonce = await client.getTransactionCount({
      address: client.account.address,
    });

    const promises: Promise<AddContentResponse>[] = [];

    contest.forEach((c) => {
      promises.push(addContent(client, c, creator, url, currNonce));
      currNonce++;
    });

    return Promise.allSettled(promises);
  });
};

export const voteContentBatch = async ({
  chain,
  privateKey,
  voter,
  entries,
}: {
  chain: EvmProtocolChain;
  privateKey: string;
  voter: string;
  entries: {
    contestAddress: string;
    contentId: string;
  }[];
}) => {
  return await nonceMutex.runExclusive(async () => {
    const client = getWalletClient({
      ...chain,
      private_key: privateKey,
    });

    let currNonce = await client.getTransactionCount({
      address: client.account.address,
    });

    const promises: Promise<TransactionReceipt>[] = [];

    entries.forEach(({ contestAddress, contentId }) => {
      promises.push(
        voteContent(client, contestAddress, voter, contentId, currNonce),
      );
      currNonce++;
    });

    return Promise.allSettled(promises);
  });
};

/**
 * attempts to rollover and payout a provided contest. Returns false and does not attempt
 * transaction if contest is still active
 * @param rpcNodeUrl the chain node to use
 * @param contest the address of the contest
 * @param oneOff indicate if the contest is oneOff
 * @returns boolean indicating if contest was rolled over
 * NOTE: A false return does not indicate an error, rather that the contest was still ongoing
 * errors will still be throw for other issues
 */
export const rollOverContest = async ({
  chain,
  privateKey,
  contest,
  oneOff,
}: {
  chain: EvmProtocolChain;
  privateKey: string;
  contest: string;
  oneOff: boolean;
}): Promise<boolean> => {
  return await nonceMutex.runExclusive(async () => {
    const client = getWalletClient({
      ...chain,
      private_key: privateKey,
    });
    const contestInstance = getContract({
      address: contest as `0x${string}`,
      abi: oneOff ? ContestGovernorSingleAbi : ContestGovernorAbi,
      client,
    });

    if (oneOff) {
      const contestEnded = await contestInstance.read.contestEnded();
      if (contestEnded) {
        return false;
      } else {
        const endTime = await contestInstance.read.endTime();
        const currentTime = Math.floor(Date.now() / 1000);
        if (Number(endTime) > currentTime) {
          return false;
        }
      }
    }

    let gasResult = BigInt(300000);
    try {
      const res = await client.estimateGas({
        account: client.account,
      });
      if (res > BigInt(100_000)) gasResult = res;
    } catch (e) {
      //eslint-disable-next-line
      //@ts-ignore no-empty
    }

    const txOptions = {
      gas: gasResult,
      ...(await client.estimateFeesPerGas()),
    };

    const { request } = oneOff
      ? await contestInstance.simulate.endContest(txOptions)
      : await contestInstance.simulate.newContest(txOptions);

    oneOff
      ? await contestInstance.write.endContest(request)
      : await contestInstance.write.newContest(request);

    return true;
  });
};

export const deployERC20Contest = async ({
  chain,
  privateKey,
  namespaceName,
  contestInterval,
  winnerShares,
  voteToken,
  voterShare,
  exchangeToken,
}: {
  chain: EvmProtocolChain;
  privateKey: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  voteToken: string;
  voterShare: number;
  exchangeToken: string;
}) => {
  return nonceMutex.runExclusive(async () => {
    const client = getWalletClient({
      ...chain,
      private_key: privateKey,
    });

    const { request } = await client.simulateContract({
      address: factoryContracts[chain.eth_chain_id].factory,
      abi: NamespaceFactoryAbi,
      functionName: 'newSingleERC20Contest',
      args: [
        namespaceName,
        BigInt(contestInterval),
        winnerShares.map((w) => BigInt(w)),
        voteToken as `0x${string}`,
        BigInt(voterShare),
        exchangeToken as `0x${string}`,
      ],
      ...(await client.estimateFeesPerGas()),
    });
    const txReceipt = await client.getTransactionReceipt({
      hash: await client.writeContract(request),
    });

    const eventLog = txReceipt.logs.find(
      (log) =>
        log.topics[0] ==
        EvmEventSignatures.NamespaceFactory.ContestManagerDeployed,
    );
    if (!eventLog || !eventLog.data) throw new Error('Contest not deployed');

    const { args } = decodeLog({
      abi: NamespaceFactoryAbi,
      eventName: 'NewContest',
      data: eventLog.data,
      topics: eventLog.topics,
    });

    return args.contest;
  });
};

export const deployNamespace = async (
  name: string,
  walletAddress: string,
  feeManager: string,
  chain: EvmProtocolChain,
  privateKey: string,
): Promise<string> => {
  const client = getWalletClient({
    ...chain,
    private_key: privateKey,
  });

  const namespaceCheck = await getNamespace(chain, name);
  if (namespaceCheck === ZERO_ADDRESS) {
    throw new Error('Namespace already reserved');
  }

  const { request } = await client.simulateContract({
    address: factoryContracts[chain.eth_chain_id].factory,
    abi: NamespaceFactoryAbi,
    functionName: 'deployNamespace',
    ...(await client.estimateFeesPerGas()),
    args: [
      name,
      `https://common.xyz/api/namespaceMetadata/${name}/{id}`,
      feeManager as `0x${string}`,
      '0x',
    ],
  });
  await client.writeContract(request);

  const namespaceAddress = await getNamespace(chain, name);

  const { request: mintRequest } = await client.simulateContract({
    address: namespaceAddress,
    abi: INamespaceAbi,
    functionName: 'mintId',
    args: [walletAddress as `0x${string}`, BigInt(1), BigInt(1), '0x'],
  });
  await client.writeContract(mintRequest);

  return namespaceAddress;
};
