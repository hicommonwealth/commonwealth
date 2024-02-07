## Testing Compound/OpenZeppelin Governance contracts on Commonwealth

### Node Configuration

The first step is to configure all necessary processes in order for Commonwealth to run. For this, we need an active hardhat chain with the requisite contract deployed on it, as well as a local chain events listener and commonwealth server.

1. Run a local hardhat node from this directory (shared/eth), via `npx hardhat node`.
2. Decide which contract you want to test: alpha, bravo, or generic OZ governance. Run the corresponding script with `ts-node scripts/deployAlpha.ts` (or deployBravo.ts or deployOz.ts depending which you decided to test). This will deploy the governance contract to the local node and print the address of the contract.
3. Select which chain you will be overriding for testing. It must already be a Compound chain. For this example, I will use **frax**, but you can use whichever you'd like. Simply edit the SQL commands as needed. Go into the database (`yarn psql`) and edit the ChainNode of frax to use the hardhat url and address printed above (`UPDATE "ChainNodes" SET url = 'ws://localhost:8545', address = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' WHERE chain = 'frax';`). If testing Alpha or Bravo, you will also need to set the token name to "comp" (`UPDATE "ChainNodes" SET token_name = 'comp' WHERE chain = 'frax';`), but on OZ you should set it to NULL instead (`UPDATE "ChainNodes" SET token_name = NULL WHERE chain = 'frax';`).
4. If running the test again after a previous test, you will need to remove prior ChainEvents from the database. Do this with the following SQL commands: `DELETE FROM "ChainEvents" WHERE chain_event_type_id LIKE 'frax%'; DELETE FROM "ChainEntities" WHERE chain = 'frax';`
5. Keeping the hardhat node up, open up two new terminals, both at the root of the Commonwealth directory. In the first, run the chain events listener via `CHAIN_EVENTS=frax yarn listen`, and in the second run Commonwealth via `yarn start`. These three should remain up until you've finished your testing process, but you will need to restart the hardhat node and chain events listener if you plan to switch to a different contract during testing.

### Frontend Usage

1. Load the frax page at http://localhost:8080/frax.
2. Configure metamask:
   1. If not already added, create a local chain via Settings -> Networks -> Add Network, at url http://localhost:8545 and chain id 31337. Ensure Metamask is set to use this chain.
   2. If not already added, Add a new address using the private key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80. Ensure this account (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) is selected.
   3. If the address already exists, reset its history using Settings -> Advanced -> Reset Account.
   4. Metamask should display slightly less than 10000 ETH for the test account.
3. Delegate to yourself via the "Delegate" page from the sidebar. Use the same address as displayed in Metamask (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) and you can enter any numeric value (it is ignored).
   - On loading this page, verify in the console that it correctly detects the type of token and governance based on the contract deployed earlier.
4. Navigate to the "Proposals" page from the sidebar. It should display a few parameters and no proposals.
5. Click "New Proposal", and it should take you to the page to create a proposal.
   a. Set whatever description you'd like.
   b. Any acceptable target address will work (0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B).
   c. Any value will work (0).
   d. Any acceptable calldata will work (0x000000000000000000000000c11b1268c1a384e55c48c2391d8d480264a3a7f40000000000000000000000000000000000000000000000000853a0d2313c0000).
   e. Signature is optional and can be any string.
6. Click "Send Transaction" and then sign it on Metamask.
7. Navigate to the "Proposals" page again via the sidebar and the proposal should appear, as "Pending".
8. To advance the proposal to the voting stage, you will need to mine blocks. Open up a console window at "commonwealth/shared/eth" and run `ts-node scripts/mineBlocks.ts 2`. This will mine 2 blocks and advance the timestamp accordingly.
9. Refresh the page to see the block update, as hardhat does not support websocket listening for ETH blocks.
10. Navigate into the proposal's page by clicking into it, and the voting options should be displayed. If you want to advance the proposal further, you should vote "YES". Sign the transaction via metamask. The vote should appear in the voting results panel.
11. After voting, advance the proposal to completion. Running `ts-node scripts/mineBlocks.ts 8` should be sufficient. Refresh the page again. The proposal should appear as "Ready to queue".
12. Now, you should be able to click "Queue" on the proposal's page. Sign the transaction via metamask. The proposal should soon appear as "Queued".
13. Advance another few blocks (10 should work?). Refresh the page again. The "Execute" button should appear on the proposal. Click it and sign the transaction via metamask. THe proposal should appear as "Executed" and will no longer be displayed as Active on the proposals page.
14. You can repeat the above process to test calling Cancel, as well as other voting choices (No, Abstain).
