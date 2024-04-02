# Stake

Community stake is a non-transferrable, fungible token bought and sold by users on a bonding curve.

Users deposit Ethereum into a smart contract in exchange for the ERC1155 stake tokens.

The received tokens are used for moderating and gating community content and features.

## Enabling stake for local development

The following env variables must be present. (The AWS keys are for )

```txt
FLAG_NEW_CREATE_COMMUNITY=true
FLAG_COMMUNITY_STAKE=true
ETH_RPC=test
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA3JC4FJBRG5N5GLMW
AWS_SECRET_ACCESS_KEY= # REDACTED
```

In your local db run:

```sql
INSERT INTO public."ChainNodes" (url, eth_chain_id, alt_wallet_url, balance_type, name) VALUES ('https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2', 11155111, 'https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2', 'ethereum', 'Sepolia');
```

Then migrate the database (`yarn migrate-db`) and create a new community, and in the `Select chain` dropdown select `Sepolia`. Make sure you have Sepolia testnet enabled in your wallet as well as some Sepolia to pay for gas fees. If you don’t have any, here is a Sepolia faucet. <https://sepoliafaucet.com/>

I think that should be all, let me know if you have any problems.

## Change Log
