# Enabling Community Governance

As of 240220, we do not have in-app support for allowing offchain communities to transition to chain communities and enable chain governance. This process must be done manually by an engineer following the steps below.

1. Update Community attributes in the database. Within the same transaction, update
    - the `type` of community from `offchain` to `chain`
    - the community `base` to match its protocol, e.g. `ethereum` for EVM
    - the `chain_node_id` to match the chain, which can be found in the `ChainNodes` table
    - the `network`; for Ethereum, this must be either `compound` or `aave`

2. Upload the contract ABI to be added.
    - If an existing contract is being added verbatim, then we can find and match it. Otherwise it must be uploaded to Etherscan.
    - Navigate to Etherscan and add the ABI, following [Etherscan's walkthrough](https://info.etherscan.com/custom-abi/).
    - NB: If the contract is an exact match, Etherscan will notify you.

3. Write a migration to add the ABI to our `ContractAbis` table.
    - As of 240220, we do not have a utility to do this for us; the migration must be written manually.
    - See the `20231212140801` divastaking migration as an example of what this migration should look like
    - We use the `node-object-hash` library for hashing the ABI.

4. Finally, update the `Contracts` table and `CommunityContracts` table
    - The `Contracts` table links the ABI (via `abi_id`) to the chain node (via `chain_node_id`) and the ABI `address`
    - The `CommunityContracts` table links the contract (via `contract_id`) to the community (via `community_id`)

5. To test, debug, and ensure success, navigate to the Common community forum. A "Proposals" tab should now show in the sidebar. Navigate to the proposals page, open up the browser console/dev tools, and try to load the proposals. If the submitted contract correctly followed an existing template, it should work out of the box.

## Change Log

- 240220: Written by Graham Johnson and Timothee Legros (#6811).
