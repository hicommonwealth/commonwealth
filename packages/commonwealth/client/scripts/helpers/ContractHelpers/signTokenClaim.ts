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

  async sign(walletAddress: string, chainId: string, data: string) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }

    const tx = {
      from: walletAddress,
      to: this.tokenAddress,
      data, // magna sends the full abi-encoded calldata
      value: '0x0', // idk what this does
      maxFeePerGas: '0x0',
      maxPriorityFeePerGas: '0x0',
    };

    const fee = await this.estimateGas();
    if (fee) {
      tx.maxFeePerGas = fee.toString();
      tx.maxPriorityFeePerGas = this.web3.utils.toWei('1', 'gwei');
    }

    const sendTx = this.web3.eth.sendTransaction(tx);

    return await new Promise<string>((resolve, reject) => {
      void sendTx
        .once('transactionHash', (hash) => {
          resolve(hash);
        })
        .once('error', (err) => {
          reject(err);
        });
    });
  }
}

export default SignTokenClaim;
