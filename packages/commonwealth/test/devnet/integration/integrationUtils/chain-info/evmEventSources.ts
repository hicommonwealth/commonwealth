/* eslint-disable */

export const evmEventSources = `
INSERT INTO "EvmEventSources" (id, chain_node_id, contract_address, event_signature, kind, abi_id, created_at_block, events_migrated, active) VALUES (1, 1, '0x7a2088a1bfc9d81c55368ae168c2c02570cb814f', '0xacba89c290ec5301484c0453f480dc9b83ab3a739c6b6e345ecd1b0525787d23', 'NewTokenCreated', 56, 1, FALSE, TRUE) ON CONFLICT (id) DO UPDATE SET created_at_block = EXCLUDED.created_at_block;
`;
