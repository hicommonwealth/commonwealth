import { Request, Response } from 'express';
import Web3 from 'web3';
import getProvider, { providerUrl } from '../utils/getProvider';
import axios from 'axios';
import { chainAdvanceTime, chainGetEth } from '../types';

const getBlockInfo = async () => {
  const provider = getProvider();
  const block = await provider.eth.getBlock(
    await provider.eth.getBlockNumber()
  );
  return block;
};

export const getAccounts = async (req: Request, res: Response) => {
  try {
    const provider = getProvider();
    const accounts = await provider.eth.getAccounts();
    res.status(200).json(accounts).send();
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

export const getBlock = async (req: Request, res: Response) => {
  try {
    const block = await getBlockInfo();
    res.status(200).json(block).send();
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

export const advanceEvmTime = async (
  time: number | string,
  blocks: number | string
) => {
  const advance_secs = Web3.utils.numberToHex(time).toString();
  await axios.post(
    providerUrl,
    // '{"jsonrpc": "2.0", "id": 1, "method": "evm_increaseTime", "params": ["0x15180"] }',
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'evm_increaseTime',
      params: [advance_secs],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  await axios.post(
    providerUrl,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'evm_mine',
      params: [{ blocks: blocks }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const advanceTimestamp = async (req: Request, res: Response) => {
  try {
    const request: chainAdvanceTime = req.body;
    const results = {
      preTime: (await getBlockInfo()).timestamp.toString(),
      postTime: '0',
    };
    await advanceEvmTime(request.seconds, request.blocks);
    results.postTime = (await getBlockInfo()).timestamp.toString();
    res.status(200).json(results).send();
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

export const getETH = async (req: Request, res: Response) => {
  try {
    const request: chainGetEth = req.body;
    const provider = getProvider();
    const accounts = await provider.eth.getAccounts();
    await provider.eth.sendTransaction({
      from: accounts[7],
      to: request.toAddress,
      value: provider.utils.toWei(request.amount),
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
