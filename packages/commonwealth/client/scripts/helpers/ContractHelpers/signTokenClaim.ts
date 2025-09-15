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
  ): Promise<void> {
    await super.initialize(withWallet, chainId);
  }

  async sign(
    walletAddress: string,
    chainId: string,
    data: string,
  ): Promise<`0x${string}`> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }

    // estimateGas can fail — fallback to 1 gwei
    let maxPriorityFeePerGas: string;
    try {
      const fee = await this.estimateGas();
      maxPriorityFeePerGas =
        fee?.toString() ?? this.web3.utils.toWei('1', 'gwei');
    } catch {
      maxPriorityFeePerGas = this.web3.utils.toWei('1', 'gwei');
    }
    const tx = {
      from: walletAddress,
      to: this.tokenAddress,
      data, // magna sends the full abi-encoded calldata
      value: '0x0', // idk what this does
      maxFeePerGas: maxPriorityFeePerGas,
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
