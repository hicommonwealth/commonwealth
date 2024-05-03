import { Request, Response } from 'express';
import { AbiItem } from 'web3-utils';
import { erc721Approve, erc721MintBurn } from '../types';
import erc_721_abi from '../utils/abi/erc721';
import { erc_721 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

export const approve721 = async (req: Request, res: Response) => {
  try {
    const request: erc721Approve = req.body;
    const provider = getProvider();
    const contract = erc_721(request.nftAddress, provider);
    const accounts = await provider.eth.getAccounts();
    const account = request.accountIndex
      ? accounts[request.accountIndex]
      : request.from;
    const txReceipt = !request.all
      ? await contract.methods
          .approve(accounts[request.to], request.tokenId)
          .send({ from: account, gas: '500000' })
      : await contract.methods
          .setApprovalForAll(accounts[request.to], true)
          .send({ from: account, gas: '500000' });
    res
      .status(200)
      .json({ block: Number(txReceipt['blockNumber']) })
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

export const transfer721 = async (req: Request, res: Response) => {
  try {
    const request: erc721Approve = req.body;
    const provider = getProvider();
    const contract = erc_721(request.nftAddress, provider);
    const accounts = await provider.eth.getAccounts();
    const account = request.accountIndex
      ? accounts[request.accountIndex]
      : request.from;
    const txReceipt = await contract.methods
      .safeTransferFrom(account, accounts[request.to], request.tokenId)
      .send({ from: account, gas: '500000' });
    res
      .status(200)
      .json({ block: Number(txReceipt['blockNumber']) })
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

export const deploy721 = async (req: Request, res: Response) => {
  try {
    const provider = getProvider();
    const contract = new provider.eth.Contract(erc_721_abi as AbiItem[]);
    const account = (await provider.eth.getAccounts())[0];
    await contract
      .deploy({ data: nftBytecode })
      .send({ from: account, gas: '3454486' })
      .on('receipt', function (receipt) {
        res
          .status(200)
          .json({ contractAddress: receipt.contractAddress })
          .send();
      });
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

export const mintBurn721 = async (req: Request, res: Response) => {
  try {
    const request: erc721MintBurn = req.body;
    const provider = getProvider();
    const contract = erc_721(request.nftAddress, provider);
    const accounts = await provider.eth.getAccounts();

    const tx = request.mint
      ? await contract.methods.safeMint(accounts[request.to], request.tokenId)
      : await contract.methods.burn(request.tokenId);
    const txReceipt = await tx.send({ from: accounts[0], gas: '500000' });

    res
      .status(200)
      .json({ block: Number(txReceipt['blockNumber']) })
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
