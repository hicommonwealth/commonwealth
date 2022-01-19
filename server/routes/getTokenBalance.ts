import {NextFunction, Request, Response} from "express";
import BN from "bn.js";
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

    const addresses: { address: string, chain: string }[] = req.body.addresses
    const tokenRoles: { guild_id: string, role_id: string, name: string, min_tokens: number,
        max_tokens: number, base: string, tokenAddress: string, eth_chain_id: number }[] = req.body.tokenRoles;

    if (!addresses) return next(new Error(Errors.NoAddress));
    if (!tokenRoles) return next(new Error(Errors.NoTokenAddress));

    const balances: {[token: string]: BN} = {}
    for (const token of tokenRoles) {
        balances[`${token.name}`] = new BN(0);
    }

    for (const address of addresses) {
        for (const token of tokenRoles) {
            try {
                const balance = await tokenBalanceCache.getBalance(token.base, address.address, token.name,
                    token.eth_chain_id, token.tokenAddress);
                balances[`${token.name}`] = balances[`${token.name}`].add(balance);
            } catch (e) {
                return next(e);
            }
        }
    }

    return res.json({status: 'Success', result: balances});
}

export default getTokenBalance;
