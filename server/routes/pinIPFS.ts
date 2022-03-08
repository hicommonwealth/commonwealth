import { Request, Response, NextFunction } from 'express';
import { DB, sequelize } from '../database';
import ipfs from '../util/ipfs';

const pinIPFS = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ipfsHash = await ipfs(req.user.id, req.body);
    return res.json({ status: 'Success', IPFSHash: ipfsHash });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};

export default pinIPFS;
