# Enabling Community Governance

As of 240307, we do not have in-app support for allowing offchain communities to enable chain governance. This process must be done manually by an engineer writing a database migration, following the steps below.

See also the `20231212140801` divastaking migration as a partial example of what this migration should look like. (`20231212140801` involves switching, rather than adding, contracts—but still roughly shows the necessary steps.)

1. The relevant `Community` database entry must be updated. Within the same transaction, update
    - the community `base` to match its protocol, e.g. `ethereum` for EVM
    - the `chain_node_id` to match the relevant row in the `ChainNodes` table
    - the blockchain `network`; for Ethereum, this will be either `compound` or `aave`
    - the `type` of community from `offchain` to `dao`
        - Any protocol (with governance) that exists on top of a chain (as smart contracts) should have receive type `dao`. Type `chain` type is reserved for communities (e.g. Osmosis) that represent an entire chain.

2. The contract ABI must be hashed and added to the database.
    - If an existing contract is being added verbatim, then we can find and match it.
    - Etherscan can be used to manually grab the ABI.
    - We use the `node-object-hash` library for hashing the ABI.
    - The ABI must be inserted into the `ContractAbis` table.

3. The `Contracts` table and `CommunityContracts` table must be updated to link to the newly added `ContractAbis` row.
    - The `Contracts` table should link the ABI (via `abi_id`) to the chain node (via `chain_node_id`) and the ABI's `address`.
    - The `CommunityContracts` table links the contract (via `contract_id`) to the community (via `community_id`)

4. To test, debug, and ensure migration success, navigate to the relevant Common community forum. A "Proposals" tab should now show in the sidebar UI. Navigate to the proposals page, open up the browser console/dev tools, and try to load the proposals.
    - If the submitted contract correctly followed an existing template, it should work out of the box.

## Change Log

- 240307: Written by Graham Johnson and Timothee Legros (#6811).
