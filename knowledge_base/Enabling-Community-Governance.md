# Enabling Community Governance

As of 240220, we do not have in-app support for allowing offchain communities to transition to chain communities and enable chain governance. This process must be done manually by an engineer writing a database migration, following the steps below.

See also the `20231212140801` divastaking migration as an example of what this migration should look like. This migration involves switching contracts, rather than adding contracts, but provides a rough reference for the necessary steps.

1. The relevant `Community` database entry must be updated. Within the same transaction, update
    - the community `base` to match its protocol, e.g. `ethereum` for EVM
    - the `chain_node_id` to match the relevant chain node, which may be found in the `ChainNodes` table
    - the `network`; for Ethereum, this will be either `compound` or `aave`
    - the `type` of community from `offchain` to either `dao` or `chain`
        - Any protocol (with governance) that exists on top of a chain (as smart contracts) should have receive type `dao`. Type `chain` type is reserved for communities that represent an entire chain, e.g. Osmosis is a community for the Osmosis Cosmos chain.

2. The contract ABI must be hashed and added to the database.
    - If an existing contract is being added verbatim, then we can find and match it.
    - Etherscan can be used manually or by API to grab the ABI.
    - We use the `node-object-hash` library for hashing the ABI.
    - The ABI must be inserted into the `ContractAbis` table.

3. Update the `Contracts` table and `CommunityContracts` table to link to the added ABI.
    - The `Contracts` table should link the ABI (via `abi_id`) to the chain node (via `chain_node_id`) and the ABI's `address`.
    - The `CommunityContracts` table links the contract (via `contract_id`) to the community (via `community_id`)

4. To test, debug, and ensure success, navigate to the Common community forum. A "Proposals" tab should now show in the sidebar. Navigate to the proposals page, open up the browser console/dev tools, and try to load the proposals. If the submitted contract correctly followed an existing template, it should work out of the box.

## Change Log

- 240307: Written by Graham Johnson and Timothee Legros (#6811).
