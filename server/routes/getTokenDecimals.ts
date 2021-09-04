
import { Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { providers } from 'ethers';

import { Erc20Factory } from '../../eth/types/Erc20Factory';
import { INFURA_API_KEY } from '../config';

export const Errors = {
  NoToken: 'No base token provided in query',
  TokenNotFound: 'Incorrect token name provided',
};

const getTokenDecimals = async (models, req: Request, res: Response, next: NextFunction) => {
  const { token } = req.query;
  if (!token) return next(new Error(Errors.NoToken));

  const chain = await models.Chain.findOne({
    where: { id: token },
  });

  if (!chain) return next(new Error(Errors.TokenNotFound));

  if (chain.decimals !== undefined) {
    return res.json({
      status: 'Success',
      result: {
        decimals: chain.decimals
      }
    });
  } else {
    const chainNode = await models.ChainNode.findOne({
      where: { chain: token },
    });

    const web3Provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${INFURA_API_KEY}`);
    const provider = new providers.Web3Provider(web3Provider);
    const api = Erc20Factory.connect(chainNode.address, provider);
    const decimals = await api.decimals();
    await chain.update({ decimals });

    return res.json({
      status: 'Success',
      result: {
        decimals
      }
    });
  }
};

export default getTokenDecimals;
