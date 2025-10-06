import ContractBase from './ContractBase';

class SignTokenClaim extends ContractBase {
  tokenAddress: string;

  constructor(tokenAddress: string, rpc: string) {
    // empty abi to make the .filter in contract work
    super(tokenAddress, [], rpc);
    this.tokenAddress = tokenAddress;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<void> {
    await super.initialize(withWallet, chainId, providerInstance);
  }

  async estimateContractGas(
    contractAddress: string,
    walletAddress: string,
    data: string,
  ): Promise<{
    gasLimit: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    requiredGasCost: string;
    balance: string;
    hasEnoughBalance: boolean;
    requiredEth: string | number;
    balanceEth: string | number;
  }> {
    try {
      const gasLimit = await this.web3.eth.estimateGas({
        from: walletAddress,
        to: contractAddress,
        data,
      });

      let maxPriorityFeePerGas: string;

      try {
        const fee = await this.web3.eth.getMaxPriorityFeePerGas();
        maxPriorityFeePerGas = fee.toString();
      } catch {
        maxPriorityFeePerGas = this.web3.utils.toWei('1', 'gwei');
      }

      const block = await this.web3.eth.getBlock('pending');
      const baseFee = block.baseFeePerGas?.toString() ?? '0';

      const maxFeePerGas = (
        BigInt(baseFee) + BigInt(maxPriorityFeePerGas)
      ).toString();

      // User balance
      const balance = (
        await this.web3.eth.getBalance(walletAddress)
      ).toString();

      const gasLimitWithBuffer = (BigInt(gasLimit) * 120n) / 100n; // +20%
      const requiredGasCost = (
        gasLimitWithBuffer * BigInt(maxFeePerGas)
      ).toString();

      const hasEnoughBalance = BigInt(balance) >= BigInt(requiredGasCost);

      // format to ETH for readability
      const requiredEth = parseFloat(
        this.web3.utils.fromWei(requiredGasCost, 'ether'),
      ).toFixed(8);
      const balanceEth = parseFloat(
        this.web3.utils.fromWei(balance, 'ether'),
      ).toFixed(8);

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas,
        maxPriorityFeePerGas,
        requiredGasCost,
        balance,
        hasEnoughBalance,
        // for ui
        requiredEth,
        balanceEth,
      };
    } catch {
      // this shouldn't happen ideally
      // fallback values
      return {
        gasLimit: '21000',
        maxFeePerGas: this.web3.utils.toWei('2', 'gwei'),
        maxPriorityFeePerGas: this.web3.utils.toWei('1', 'gwei'),
        requiredGasCost: '0',
        balance: '0',
        hasEnoughBalance: false,
        requiredEth: 0,
        balanceEth: 0,
      };
    }
  }

  async sign(
    walletAddress: string,
    chainId: string,
    data: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<`0x${string}`> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    const {
      maxPriorityFeePerGas,
      maxFeePerGas,
      hasEnoughBalance,
      requiredEth,
      balanceEth,
      gasLimit,
    } = await this.estimateContractGas(this.tokenAddress, walletAddress, data);
    if (!hasEnoughBalance) {
      throw new Error(
        `Not enough gas: requires ~${requiredEth} ETH for fees, but wallet only has ${balanceEth} ETH.
         Please add more ETH to your wallet to claim your tokens.`,
      );
    }

    const tx = {
      from: walletAddress,
      to: this.tokenAddress,
      data, // magna sends the full abi-encoded calldata
      value: '0x0', // idk what this does
      gas: gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    return new Promise((resolve, reject) => {
      try {
        void this.web3.eth
          .sendTransaction(tx)
          .once('transactionHash', (hash) => resolve(hash as `0x${string}`))
          .once('error', (err) => reject(err));
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default SignTokenClaim;
