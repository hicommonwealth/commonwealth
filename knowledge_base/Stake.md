# Stake

Community stake is a non-transferable, fungible token bought and sold by users on a bonding curve.

Users deposit Ethereum into a smart contract in exchange for the ERC1155 stake tokens.

The received tokens are used for moderating and gating community content and features.

## Enabling stake for local development

The following env variables must be present. (The AWS keys are for uploading images, in the create community flow.) For more thorough documentation on env vars, see [Environment-Variables.md](./Environment-Variables.md).

```txt
FLAG_NEW_CREATE_COMMUNITY=true
FLAG_COMMUNITY_STAKE=true
ETH_RPC=test
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA3JC4FJBRG5N5GLMW
AWS_SECRET_ACCESS_KEY= # REDACTED
```

Within the local database instance, run:

```sql
INSERT INTO public."ChainNodes" (url, eth_chain_id, alt_wallet_url, balance_type, name) VALUES ('https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2', 11155111, 'https://eth-sepolia.g.alchemy.com/v2/G-9qTX3nSlAcihqA056hwGHiiolrUQj2', 'ethereum', 'Sepolia');
```

Then migrate the database (`yarn migrate-db`) and create a new community within the Common app. From the `Select chain` dropdown in the Create Community Form, select `Sepolia`.

Sepolia testnet must be enabled in your web wallet, with some Sepolia to pay for gas fees. This can be obtained from a [Sepolia faucet](https://sepoliafaucet.com/).

For any issues, reach out to Ian Rowan.

## Change Log

- 240424: Authored by Israel Lund; added by Graham Johnson (#7681).
