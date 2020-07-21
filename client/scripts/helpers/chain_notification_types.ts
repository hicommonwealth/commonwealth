export const EdgewareChainNotificationTypes = {
    Council: [
        'edgeware-collective-disapproved',
        'edgeware-collective-executed',
        'edgeware-collective-member-executed',
        'edgeware-collective-proposed',
        'edgeware-collective-voted',
        'edgeware-election-candidacy-submitted',
        'edgeware-election-empty-term',
        'edgeware-election-member-kicked',
        'edgeware-election-member-renounced',
        'edgeware-election-new-term',
    ],
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
    Signaling: [
        'edgeware-signaling-commit-started',
        'edgeware-signaling-new-proposal',
        'edgeware-signaling-voting-completed',
        'edgeware-signaling-voting-started',
    ],
    Treasury: [
        'edgeware-treasury-awarded',
        'edgeware-treasury-proposed',
        'edgeware-treasury-rejected',
        'edgeware-treasury-reward-minting',
        'edgeware-treasury-reward-minting-v2'
    ],
    Validator: [
        'edgeware-bonded',
        'edgeware-reward',
        'edgeware-slash',
        'edgeware-unbonded',
    ],
    Vote: [
        'edgeware-vote-delegated',
    ],
};
