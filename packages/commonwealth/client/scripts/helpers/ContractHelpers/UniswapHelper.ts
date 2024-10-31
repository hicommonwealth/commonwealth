import { ChainBase } from '@hicommonwealth/shared';
import {
  CurrencyAmount,
  Ether,
  Percent,
  Token,
  TradeType,
} from '@uniswap/sdk-core';
import { AlphaRouter } from '@uniswap/smart-order-router';
import WebWalletController from 'controllers/app/web_wallets';
import { ethers } from 'ethers';
import Web3 from 'web3';

/**
 * Get quote for ETH to token or token to ETH swap
 */
async function getETHQuote(
  tokenAddress: string,
  amount: number,
  isETHIn: boolean,
  walletAddress: string,
  chainNode: string,
  chainId: number,
) {
  const ethersProvider = new ethers.providers.JsonRpcProvider(chainNode);
  const router = new AlphaRouter({
    chainId: chainId,
    provider: ethersProvider,
  });

  const ETH = Ether.onChain(chainId);
  const token = new Token(1, tokenAddress, 18);

  let inputAmount;
  if (isETHIn) {
    // ETH to Token
    const weiAmount = Web3.utils.toWei(amount.toString(), 'ether');
    inputAmount = CurrencyAmount.fromRawAmount(ETH, weiAmount);
  } else {
    // Token to ETH
    const tokenWei = amount * 10 ** 18;
    inputAmount = CurrencyAmount.fromRawAmount(token, tokenWei.toString());
  }

  try {
    const route = await router.route(
      inputAmount,
      isETHIn ? token : ETH,
      TradeType.EXACT_INPUT,
      {
        type: 1,
        recipient: walletAddress,
        slippageTolerance: new Percent(0.5, 1), // 0.5%
        deadline: Math.floor(Date.now() / 1000 + 1800),
      },
    );

    return route;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

/**
 * Execute ETH to token swap
 */
async function swapETHForToken(
  tokenAddress: string,
  ethAmount: number,
  walletAddress: string,
  chainId: number,
  chainNode: string,
) {
  try {
    const route = await getETHQuote(
      tokenAddress,
      ethAmount,
      true,
      walletAddress,
      chainNode,
      chainId,
    );

    if (!route?.methodParameters) {
      throw new Error('No route found');
    }
    const web3 = await getWalletProvider(chainId);
    const tx = {
      from: walletAddress,
      to: route.methodParameters.to,
      data: route.methodParameters.calldata,
      value: route.methodParameters.value,
      gasPrice: await web3.eth.getGasPrice(),
      gas: route.estimatedGasUsed.toString(),
    };

    const receipt = await web3.eth.sendTransaction(tx);
    return receipt;
  } catch (error) {
    console.error('Error swapping ETH for token:', error);
    throw error;
  }
}

/**
 * Execute token to ETH swap
 */
async function swapTokenForETH(
  tokenAddress: string,
  tokenAmount: number,
  walletAddress: string,
  chainId: number,
  chainNode: string,
) {
  try {
    const route = await getETHQuote(
      tokenAddress,
      tokenAmount,
      false,
      walletAddress,
      chainNode,
      chainId,
    );

    if (!route?.methodParameters) {
      throw new Error('No route found');
    }

    const web3 = await getWalletProvider(chainId);

    // Need to approve the router
    const tokenContract = new web3.eth.Contract(
      [
        {
          inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          name: 'approve',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      tokenAddress,
    );

    // Approve the router to spend tokens
    const amountIn = tokenAmount * 10 ** 18;
    await tokenContract.methods
      .approve(route.methodParameters.to, amountIn.toString())
      .send({ from: walletAddress });

    const tx = {
      from: walletAddress,
      to: route.methodParameters.to,
      data: route.methodParameters.calldata,
      value: '0',
      gasPrice: await web3.eth.getGasPrice(),
      gas: route.estimatedGasUsed.toString(),
    };

    const receipt = await web3.eth.sendTransaction(tx);
    return receipt;
  } catch (error) {
    console.error('Error swapping token for ETH:', error);
    throw error;
  }
}

async function getWalletProvider(chainId: number): Promise<Web3> {
  try {
    const wallet = WebWalletController.Instance.availableWallets(
      ChainBase.Ethereum,
    )[0];

    if (!wallet.api) {
      await wallet.enable(chainId);
    }
    await wallet.switchNetwork(chainId);
    const provider = wallet.api.givenProvider;

    return new Web3(provider);
  } catch (error) {
    throw new Error('Failed to initialize contract: ' + error);
  }
}
