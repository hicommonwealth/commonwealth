import { Request, Response } from 'express';
import Web3 from 'web3';
import {
  dexGetTokens,
  erc20Approve,
  erc20BalanceReq,
  erc20Transfer,
} from '../types';
import { erc20, uniswapV2 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

export const getBalance = async (req: Request, res: Response) => {
  try {
    const request: erc20BalanceReq = req.body;
    const contract = erc20(request.tokenAddress, getProvider());
    let balance: string = await contract.methods
      .balanceOf(request.address)
      .call();
    if (request.convert) {
      //TODO: dynamic
      balance = Web3.utils.fromWei(balance);
    }
    res
      .status(200)
      .json({
        balance: balance,
      })
      .send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const transfer = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const request: erc20Transfer = req.body;
    const provider = getProvider();
    const contract = erc20(request.tokenAddress, provider);
    const account = request.fromBank
      ? '0xF977814e90dA44bFA03b6295A0616a897441aceC'
      : (await provider.eth.getAccounts())[request.accountIndex ?? 0];
    let txReceipt;
    if (!request.fromBank && request.from) {
      txReceipt = await contract.methods
        .transferFrom(
          request.to,
          request.from,
          Web3.utils.toWei(request.amount)
        )
        .send({ from: account, gasLimit: 400000 });
    } else {
      txReceipt = await contract.methods
        .transfer(request.to, Web3.utils.toWei(request.amount))
        .send({ from: account, gasLimit: 400000 });
    }
    res.status(200).json({ block: txReceipt['blockNumber'] }).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const approve = async (req: Request, res: Response) => {
  try {
    const request: erc20Approve = req.body;
    const provider = getProvider();
    const accounts = await provider.eth.getAccounts();
    const contract = erc20(request.tokenAddress, provider);
    const txReceipt = await contract.methods
      .approve(request.spender, request.amount)
      .send({ from: accounts[request.accountIndex ?? 0] });
    res.status(200).json({ block: txReceipt['blockNumber'] }).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};

export const getTokens = async (req: Request, res: Response) => {
  try {
    const request: dexGetTokens = req.body;
    const provider = getProvider();
    const account = (await provider.eth.getAccounts())[
      request.accountIndex ?? 0
    ];
    const contract = uniswapV2(
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      provider
    );
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    request.tokens.forEach(async (token, i) => {
      await contract.methods
        .swapExactETHForTokensSupportingFeeOnTransferTokens(
          0,
          [WETH, token],
          account,
          Math.floor(Date.now() / 1000) + 60 * 200
        )
        .send({ from: account, value: request.value[i], gasLimit: 500000 });
    });
    res.status(200).send();
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: 'Internal server error',
        error: String(err),
      })
      .send();
  }
};
