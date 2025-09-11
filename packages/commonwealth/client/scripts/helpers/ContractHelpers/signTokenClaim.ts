import ContractBase from './ContractBase';

class SignTokenClaim extends ContractBase {
  tokenAddress: string;

  constructor(tokenAddress: string, rpc: string) {
    super(tokenAddress, undefined, rpc);
    this.tokenAddress = tokenAddress;
  }

  async initialize(
    withWallet?: boolean,
    chainId?: string | undefined,
  ): Promise<void> {
    await super.initialize(withWallet, chainId);
  }

  async signTokenClaim(
    walletAddress: string,
    chainId: string,
    data: string, // the data returned by magna
  ) {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId);
    }
    // TODO: Do we need a claim token function from a contract with ABI?
    // const txReceipt = await claimToken(...);
    // return txReceipt;
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
}

export default SignTokenClaim;
