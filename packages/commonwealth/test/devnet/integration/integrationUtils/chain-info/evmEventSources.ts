/* eslint-disable */

export const evmEventSources = `
INSERT INTO "EvmEventSources" (id, chain_node_id, contract_address, event_signature, kind, abi_id, created_at_block, events_migrated, active) VALUES (1, 1, '0x7a2088a1bfc9d81c55368ae168c2c02570cb814f', 'empty', 'LaunchpadCreated', 56, 1, FALSE, TRUE) ON CONFLICT (id) DO UPDATE SET created_at_block = EXCLUDED.created_at_block;
`;
