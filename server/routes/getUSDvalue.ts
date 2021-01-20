/* eslint-disable guard-for-in */
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const Errors = {
  ChainSymbolNotFound: 'Cannot find chain symbol name'
};

const apiUrl_prefix = 'https://www.mxc.co/open/api/v2/market/ticker?api_key=';
const apiUrl_postfix = '&limit=1000&req_time=1572936251&startTime=1572076703000&sign=0d1a5ee9e76a4907abedc4fe383ddfd0&symbol=';
const api_key = 'mx0R1RAC8f4ysok2Zz';

const getUSDvalue = async (models, req: Request, res: Response, next: NextFunction) => {
  const { chain_symbol, stash_id } = req.query;

  if (!chain_symbol) return next(new Error(Errors.ChainSymbolNotFound));
  let _result;
  let _status = 'Success';
  try {
    const resp = await axios.get(`${apiUrl_prefix + api_key + apiUrl_postfix + chain_symbol.toUpperCase()}_USDT`);
    _result = resp.data;
  } catch (e) {
    _status = 'Error';
    _result = [`Unable to fetch USD value for ${chain_symbol}`];
  }

  return res.json({
    status: _status,
    result: _result
  });
};

export default getUSDvalue;
