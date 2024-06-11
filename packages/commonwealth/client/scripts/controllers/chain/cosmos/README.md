# Cosmos Controllers

Adds Cosmos functionality for Stargate chains using cosmjs 0.26.

## Testing Instructions

First we will configure an Osmosis node, then we will link our account to the Commonwealth site and attempt to use it.

### Set up a local Osmosis node

- Install osmosisd via:

```
git clone https://github.com/osmosis-labs/osmosis
cd osmosis
git checkout v3.1.0
make install
```

- Verify installation via:

```
osmosisd version
```

- Set up two pairs of keys (save their recovery words for later):

```
osmosisd keys add <key1Name>
osmosisd keys add <key2Name>
```

- Verify both keys have addresses (I will use `<keyXAddress>`) via:

```
osmosisd keys list
```

- Initialize a local osmosis chain:

```
osmosisd config chain-id osmosis-local-1
osmosisd init --chain-id=osmosis-local-1 <node_name>
```

- Edit the `~/.osmosisd/config/genesis.json` file, in the following ways:
    - Replace all instances of "stake" with "uosmo", changing the default currency denomination.
    - Add initial balances for each of your keys:
  ```
  osmosisd add-genesis-account <key1Name> 100000000uosmo
  osmosisd add-genesis-account <key2Name> 100000000uosmo
  ```

    - Under "gov", modify the max deposit and voting periods (here I use 4 minutes for both deposit and voting times):
  ```
  "gov": {
    "starting_proposal_id": "1",
    "deposits": [],
    "votes": [],
    "proposals": [],
    "deposit_params": {
    "min_deposit": [
      {
        "denom": "uosmo",
        "amount": "10000000"
      }
    ],
    "max_deposit_period": "240s"
  },
  "voting_params": {
    "voting_period": "240s"
  },
  ```

- Run the following command and copy down the output as your `<validatorKey>`:

```
osmosisd tendermint show-validator
```

- Run the following command, using the first key name and the validator key from the pervious step, to create your
  initial validator at genesis:

```
osmosisd gentx <key1Name> 1000000uosmo \
  --chain-id="osmosis-local-1" \
  --moniker=osmosiswhale \
  --website="https://osmosis.zone" \
  --details="We love Osmossis" \
  --commission-rate="0.1" \
  --commission-max-rate="0.20" \
  --commission-max-change-rate="0.01" \
  --min-self-delegation="1" \
  --identity="5B5AB9D8FBBCEDC6" \
  --pubkey="<validatorKey>"
```

- Collect the validator tx in the genesis:

```
osmosisd collect-gentxs
```

- Start your node with

```
osmosisd start
```

It should produce blocks.

If at any point after you've run `osmosisd start` you encounter an issue with the configuration, or if it fails to
start, you can reset back to genesis by running:

```
osmosisd unsafe-reset-all
```

While the node is running, you can verify your account's balances via:

```
osmosisd query bank balances <keyXAddress>
```

You can also submit a proposal via the command line:

```
osmosisd tx gov submit-proposal cancel-software-upgrade --description test --title test --from <keyXAddress> --chain-id osmosis-local-1
```

### Link with Commonwealth Site

- Ensure you have a fresh DB, and run the migrations via `npx sequelize db:migrate`.
- Use `pnpm psql` to access the DB, and set the osmosis-local chain to active via the following SQL command:

```
UPDATE "Communities" SET "active" = true WHERE id = 'osmosis-local';
```

- Run the Commonwealth server via `pnpm start`.
- Navigate to `http://localhost:8080/osmosis-local` and wait for the page to load.
- Open Keplr and add an account using the mnemonic for the second key you created earlier.
    - **NOTE: IT IS VERY IMPORTANT YOU DO NOT USE THE FIRST KEY, AS IT WILL HAVE "account-number" SET TO 0, WHICH WILL
      CAUSE BUGS IN THE WEB UI.**
    - You may need to "Connect" this new account, so that it is selected and will be received by Commonwealth for login.
- Use that account to log in via Keplr wallet. It should ask you if you want to add "Osmosis Local" as a chain, and you
  should accept.
    - Then, you can go into Keplr and select the "Osmosis Local" chain under "Beta", and it should display your balance
      as initialized earlier.
- Create a new proposal using "New Thread" -> "New text proposal".
    - If you specify a deposit less than the minimum deposit, the new proposal will be in the Deposit stage, and you can
      add deposits until it is past that threshold, after which it will move to the Voting stage.
    - If you specify a deposit above the minimum deposit, the new proposal will immediately be in the Voting stage, and
      you can vote Yes, No, Abstain, or No With Veto.
    - If a proposal has been in the Deposit stage for 4 minutes without receiving the minimum deposit, it will be
      removed from the chain.
    - If a proposal receives enough Yes votes, it will be marked "Passed".
    - If a proposal receives enough No votes, it will be marked "Rejected".
    - If a proposal fails to receive enough votes, it will be marked "Failed".
- For QA: ensure that all the transaction types and features work.