import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';
import { getSupportedEthChainIds, getUrlsForEthChainId } from '../util/supportedEthChains';

// TODO: fetch native currency as well as url to support adding chain on metamask
const getSupportedEthChains = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // if the caller passes a chain_id into the query, only fetch that URL, if available
  // TODO: integrate into a fetched chainlist like https://chainid.network/chains.json
  //   and validate the URL as needed (i.e. supports websockets)
  if (req.query.chain_id) {
    const chainId = +req.query.chain_id;
    try {
      const supportedChainUrls = await getUrlsForEthChainId(models, chainId);
      return res.json({ status: 'Success', result: { [chainId]: supportedChainUrls } });
    } catch (e) {
      return res.json({ status: 'Failure', message: e.message });
    }
  }

  // otherwise, fetch all chainId/URL combinations we support currently
  try {
    const supportedChainIds = await getSupportedEthChainIds(models);
    return res.json({ status: 'Success', result: supportedChainIds });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};

export default getSupportedEthChains;
