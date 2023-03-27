import { Request, Response } from 'express';
import { erc721Approve } from '../types';
import { erc_721 } from '../utils/contracts';
import getProvider from '../utils/getProvider';

export const approve721 = async (req: Request, res: Response) => {
  try {
    const request: erc721Approve = req.body;
    const provider = getProvider();
    const contract = erc_721(request.nftAddress, provider);
    const account = request.accountIndex
      ? (await provider.eth.getAccounts())[request.accountIndex]
      : request.from;
    request.all
      ? await contract.methods
          .approve(request.to, request.tokenId)
          .send({ from: account, gasLimit: 500000 })
      : await contract.methods
          .setApprovalForAll(request.to)
          .send({ from: account, gasLimit: 500000 });
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

export const transfer721 = async (req: Request, res: Response) => {
  try {
    const request: erc721Approve = req.body;
    const provider = getProvider();
    const contract = erc_721(request.nftAddress, provider);
    const account = request.accountIndex
      ? (await provider.eth.getAccounts())[request.accountIndex]
      : request.from;
    await contract.methods
      .transferFrom(account, request.to, request.tokenId)
      .send({ from: account, gasLimit: 500000 });
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
