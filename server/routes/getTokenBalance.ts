import {NextFunction, Request, Response} from "express";
import {DB} from "../database";
import TokenBalanceCache from "../util/tokenBalanceCache";

export const Errors = {
    NoAddress: 'No address given',
    NoChain: 'No chain given',
    NoTokenAddress: 'No token contract address given'
};

const getTokenBalance = async (
    models: DB,
    tokenBalanceCache: TokenBalanceCache,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.params.address) return next(new Error(Errors.NoAddress));
    if (!req.params.chain) return next(new Error(Errors.NoChain));
    if (!req.params.tokenAddress) return next(new Error(Errors.NoTokenAddress));

    try {
        const balance = await tokenBalanceCache.getBalance(req.params.chain, req.params.address, null, null,
            req.params.tokenAddress);
        return res.json({status: 'Success', result: balance});
    } catch (e) {
        return next(e);
    }
}

export default getTokenBalance;
