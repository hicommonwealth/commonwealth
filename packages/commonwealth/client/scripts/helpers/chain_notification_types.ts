export const EdgewareChainNotificationTypes = {
  Democracy: [
    'edgeware-democracy-cancelled',
    'edgeware-democracy-executed',
    'edgeware-democracy-not-passed',
    'edgeware-democracy-passed',
    'edgeware-democracy-proposed',
    'edgeware-democracy-started',
    'edgeware-democracy-tabled',
  ],
  Preimage: [
    'edgeware-preimage-invalid',
    'edgeware-preimage-missing',
    'edgeware-preimage-noted',
    'edgeware-preimage-reaped',
    'edgeware-preimage-used',
  ],
  Treasury: [
    'edgeware-treasury-awarded',
    'edgeware-treasury-proposed',
    'edgeware-treasury-rejected',
    'edgeware-treasury-reward-minting',
    'edgeware-treasury-reward-minting-v2',
  ],
  Validator: ['edgeware-reward', 'edgeware-slash'],
  VotingDelegation: ['edgeware-vote-delegated'],
};

export const PolkadotChainNotificationTypes = {
  Democracy: [
    'polkadot-democracy-cancelled',
    'polkadot-democracy-executed',
    'polkadot-democracy-not-passed',
    'polkadot-democracy-passed',
    'polkadot-democracy-proposed',
    'polkadot-democracy-started',
    'polkadot-democracy-tabled',
  ],
  Preimage: [
    'polkadot-preimage-invalid',
    'polkadot-preimage-missing',
    'polkadot-preimage-noted',
    'polkadot-preimage-reaped',
    'polkadot-preimage-used',
  ],
  Treasury: [
    'polkadot-treasury-awarded',
    'polkadot-treasury-proposed',
    'polkadot-treasury-rejected',
  ],
  Validator: ['polkadot-reward', 'polkadot-slash'],
  VotingDelegation: ['polkadot-vote-delegated'],
};

export const KusamaChainNotificationTypes = {
  Democracy: [
    'kusama-democracy-cancelled',
    'kusama-democracy-executed',
    'kusama-democracy-not-passed',
    'kusama-democracy-passed',
    'kusama-democracy-proposed',
    'kusama-democracy-started',
    'kusama-democracy-tabled',
  ],
  Preimage: [
    'kusama-preimage-invalid',
    'kusama-preimage-missing',
    'kusama-preimage-noted',
    'kusama-preimage-reaped',
    'kusama-preimage-used',
  ],
  Treasury: [
    'kusama-treasury-awarded',
    'kusama-treasury-proposed',
    'kusama-treasury-rejected',
  ],
  Validator: ['kusama-reward', 'kusama-slash'],
  VotingDelegation: ['kusama-vote-delegated'],
};

export const KulupuChainNotificationTypes = {
  Democracy: [
    'kulupu-democracy-cancelled',
    'kulupu-democracy-executed',
    'kulupu-democracy-not-passed',
    'kulupu-democracy-passed',
    'kulupu-democracy-proposed',
    'kulupu-democracy-started',
    'kulupu-democracy-tabled',
  ],
  Preimage: [
    'kulupu-preimage-invalid',
    'kulupu-preimage-missing',
    'kulupu-preimage-noted',
    'kulupu-preimage-reaped',
    'kulupu-preimage-used',
  ],
  Treasury: [
    'kulupu-treasury-awarded',
    'kulupu-treasury-proposed',
    'kulupu-treasury-rejected',
  ],
  Validator: ['kulupu-reward', 'kulupu-slash'],
  VotingDelegation: ['kulupu-vote-delegated'],
};

export const DydxChainNotificationTypes = {
  Governance: [
    'proposal-canceled',
    'proposal-created',
    'proposal-executed',
    'proposal-queued',
    'vote-emitted',
  ],
  Token: [
    'delegate-changed',
    'delegated-power-changed',
    'transfer',
    'approval',
  ],
};

export const AaveChainNotificationTypes = {
  Governance: [
    'proposal-canceled',
    'proposal-created',
    'proposal-executed',
    'proposal-queued',
    'vote-emitted',
  ],
  Token: [
    'delegate-changed',
    'delegated-power-changed',
    'transfer',
    'approval',
  ],
};
