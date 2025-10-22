import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
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
    magnaPlatformFee?: string,
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
      // Estimate gas with the same parameters as the actual transaction
      const gasLimit = await this.web3.eth.estimateGas({
        from: walletAddress,
        to: contractAddress,
        data,
        value: magnaPlatformFee, // Include the value to prevent contract reversion
      });

      const maxPriorityFeePerGas = this.web3.utils.toWei('2', 'gwei');

      const block = await this.web3.eth.getBlock('pending');
      const baseFee = block.baseFeePerGas?.toString() ?? '0';

      const maxFeePerGas = (
        BigInt(baseFee) + BigInt(maxPriorityFeePerGas)
      ).toString();

      // User balance
      const balance = (
        await this.web3.eth.getBalance(walletAddress)
      ).toString();

      // Calculate total cost: gas cost + magna platform fee
      const gasLimitWithBuffer = (BigInt(gasLimit) * 120n) / 100n; // +20% gas buffer
      const gasCost = gasLimitWithBuffer * BigInt(maxFeePerGas);
      const totalRequiredCost = magnaPlatformFee
        ? gasCost + BigInt(magnaPlatformFee)
        : gasCost;

      const hasEnoughBalance = BigInt(balance) >= totalRequiredCost;

      // format to ETH for readability
      const requiredEth = parseFloat(
        this.web3.utils.fromWei(totalRequiredCost.toString(), 'ether'),
      ).toFixed(8);

      const balanceEth = parseFloat(
        this.web3.utils.fromWei(balance, 'ether'),
      ).toFixed(8);

      return {
        gasLimit: gasLimit.toString(),
        maxFeePerGas,
        maxPriorityFeePerGas,
        requiredGasCost: totalRequiredCost.toString(),
        balance,
        hasEnoughBalance,
        // for ui
        requiredEth,
        balanceEth,
      };
    } catch (e) {
      console.error('Gas estimation error: ', e, { 'revert reason': e?.data });
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
    hasMagnaPlatformFee: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    providerInstance?: any,
  ): Promise<`0x${string}`> {
    if (!this.initialized || !this.walletEnabled) {
      await this.initialize(true, chainId, providerInstance);
    }

    // Magna platform fee that needs to be sent with the transaction
    const magnaPlatformFee = hasMagnaPlatformFee
      ? '200000000000000'
      : undefined; // 0.0002 ETH

    const {
      maxFeePerGas,
      maxPriorityFeePerGas,
      hasEnoughBalance,
      requiredEth,
      balanceEth,
      gasLimit,
    } = await this.estimateContractGas(
      this.tokenAddress,
      walletAddress,
      data,
      magnaPlatformFee,
    );
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
      value: magnaPlatformFee, // fee from magna
      gas: gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    return new Promise((resolve, reject) => {
      try {
        void this.web3.eth
          .sendTransaction(tx)
          .once('transactionHash', (hash) => resolve(hash as `0x${string}`))
          .once('error', (err) => {
            console.error(err);
            reject(err);
          })
          .then(async () => {
            // add token to wallet
            await this.web3?.currentProvider?.request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                // `C` token
                options: {
                  address: '0xD7DA840121aeb9792b202bd84Db32B2816B30c0e',
                  symbol: 'C',
                  decimals: 18,
                  chainId: parseInt(chainId),
                  imgUrl: `https://${PRODUCTION_DOMAIN}/brand_assets/common.png`,
                },
              },
            });
          })
          .catch((e) => {
            console.error('Tx error: ', e);
          });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default SignTokenClaim;
