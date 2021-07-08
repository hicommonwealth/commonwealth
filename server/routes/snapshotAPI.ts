
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const url = `${process.env.SNAPSHOT_HUB_URL || 'https://testnet.snapshot.org'}/api/message`;
  axios.post(url, {
    address: req.body.address,
    msg: req.body.msg,
    sig: req.body.sig,
  }).then((response) => {
    console.log(`statusCode: ${response.status}`);
    return res.json({ status: 'Success', message: response.data });
  }).catch((error) => {
    console.error(error);
    return res.json({ status: 'Failure', message: error.response.data });
  });
};
