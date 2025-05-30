/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/single_contest.json`.
 */
export type SingleContest = {
  address: 'Emx5wMhCNPULbwyY5SJpFVr1UFpgyPqugtkNvMUBoh9n';
  metadata: {
    name: 'singleContest';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'addContent';
      discriminator: [183, 126, 202, 103, 73, 114, 135, 191];
      accounts: [
        {
          name: 'contest';
          writable: true;
        },
        {
          name: 'content';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 111, 110, 116, 101, 110, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
              {
                kind: 'account';
                path: 'contest.content_count';
                account: 'contest';
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['contest'];
        },
        {
          name: 'creator';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'url';
          type: 'string';
        },
      ];
    },
    {
      name: 'claimAllRewards';
      discriminator: [132, 203, 246, 173, 206, 240, 85, 120];
      accounts: [
        {
          name: 'contest';
          writable: true;
        },
        {
          name: 'prizeVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
            ];
          };
        },
        {
          name: 'authority';
          signer: true;
          relations: ['contest'];
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [];
    },
    {
      name: 'claimProtocolFee';
      discriminator: [165, 228, 133, 48, 99, 249, 255, 33];
      accounts: [
        {
          name: 'contest';
        },
        {
          name: 'prizeVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
            ];
          };
        },
        {
          name: 'protocolFeeDestinationTokenAccount';
          writable: true;
        },
        {
          name: 'authority';
          signer: true;
          relations: ['contest'];
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [];
    },
    {
      name: 'depositPrize';
      discriminator: [245, 164, 83, 19, 96, 75, 73, 130];
      accounts: [
        {
          name: 'contest';
        },
        {
          name: 'prizeVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
            ];
          };
        },
        {
          name: 'depositor';
          writable: true;
          signer: true;
        },
        {
          name: 'depositorTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'endContest';
      discriminator: [87, 244, 178, 174, 95, 229, 104, 167];
      accounts: [
        {
          name: 'contest';
          writable: true;
        },
        {
          name: 'prizeVault';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
            ];
          };
        },
        {
          name: 'authority';
          signer: true;
          relations: ['contest'];
        },
      ];
      args: [];
    },
    {
      name: 'initializeContest';
      discriminator: [8, 124, 233, 229, 42, 156, 92, 3];
      accounts: [
        {
          name: 'contest';
          writable: true;
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
        },
        {
          name: 'prizeMint';
        },
        {
          name: 'prizeVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'contest';
              },
            ];
          };
        },
        {
          name: 'protocolFeeDestination';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'contestLengthSeconds';
          type: 'i64';
        },
        {
          name: 'winnerShares';
          type: {
            vec: 'u16';
          };
        },
        {
          name: 'protocolFeePercentage';
          type: 'u16';
        },
        {
          name: 'seed';
          type: 'u8';
        },
      ];
    },
    {
      name: 'voteContent';
      discriminator: [140, 96, 200, 175, 50, 118, 41, 99];
      accounts: [
        {
          name: 'contest';
          writable: true;
        },
        {
          name: 'content';
          writable: true;
        },
        {
          name: 'voteRecord';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [118, 111, 116, 101];
              },
              {
                kind: 'account';
                path: 'content';
              },
              {
                kind: 'account';
                path: 'voter';
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
          relations: ['contest'];
        },
        {
          name: 'voter';
        },
        {
          name: 'voterTokenAccount';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
      ];
      args: [];
    },
  ];
  accounts: [
    {
      name: 'content';
      discriminator: [3, 76, 253, 21, 4, 198, 52, 206];
    },
    {
      name: 'contest';
      discriminator: [216, 26, 88, 18, 251, 80, 201, 96];
    },
    {
      name: 'voteRecord';
      discriminator: [112, 9, 123, 165, 234, 9, 157, 167];
    },
  ];
  events: [
    {
      name: 'contentAdded';
      discriminator: [2, 8, 195, 62, 212, 6, 60, 31];
    },
    {
      name: 'newContest';
      discriminator: [95, 90, 145, 160, 242, 149, 175, 197];
    },
    {
      name: 'tokenSwept';
      discriminator: [253, 129, 39, 72, 84, 197, 14, 52];
    },
    {
      name: 'transferFailed';
      discriminator: [230, 99, 47, 56, 170, 164, 175, 37];
    },
    {
      name: 'voterVoted';
      discriminator: [80, 109, 162, 174, 107, 152, 162, 54];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'invalidContestLength';
      msg: 'The contest end time must be after the start time.';
    },
    {
      code: 6001;
      name: 'noWinnerSharesProvided';
      msg: 'Winner shares cannot be empty.';
    },
    {
      code: 6002;
      name: 'invalidWinnerSharesSum';
      msg: 'Sum of winner shares must equal 10000 basis points (100%).';
    },
    {
      code: 6003;
      name: 'invalidProtocolFeePercentage';
      msg: 'Protocol fee percentage must be between 0 and 10000 basis points.';
    },
    {
      code: 6004;
      name: 'timestampOverflow';
      msg: 'Timestamp calculation resulted in an overflow.';
    },
    {
      code: 6005;
      name: 'numericOverflow';
      msg: 'Numeric calculation resulted in an overflow.';
    },
    {
      code: 6006;
      name: 'contestAlreadyEnded';
      msg: 'Contest has already ended.';
    },
    {
      code: 6007;
      name: 'contestNotActive';
      msg: 'Contest is not active (either not started or already ended).';
    },
    {
      code: 6008;
      name: 'urlTooLong';
      msg: 'Content URL exceeds maximum allowed length.';
    },
    {
      code: 6009;
      name: 'contentNotInContest';
      msg: 'The provided content account does not belong to this contest.';
    },
    {
      code: 6010;
      name: 'zeroVotingPower';
      msg: 'Voter has zero voting power (zero token balance).';
    },
    {
      code: 6011;
      name: 'incorrectPrizeMint';
      msg: 'Voter token account is for the wrong SPL Token mint.';
    },
    {
      code: 6012;
      name: 'invalidTokenOwner';
      msg: 'Voter token account is not owned by the voter.';
    },
    {
      code: 6013;
      name: 'zeroDepositAmount';
      msg: 'Deposit amount must be greater than zero.';
    },
    {
      code: 6014;
      name: 'contestNotEndedYet';
      msg: 'Contest has not reached its end time yet.';
    },
    {
      code: 6015;
      name: 'invalidAuthority';
      msg: 'Invalid authority for this action.';
    },
    {
      code: 6016;
      name: 'notContentCreator';
      msg: 'Signer is not the creator of this content.';
    },
    {
      code: 6017;
      name: 'notAWinner';
      msg: 'The content creator is not among the winners.';
    },
    {
      code: 6018;
      name: 'rewardAlreadyClaimed';
      msg: 'This reward has already been claimed.';
    },
    {
      code: 6019;
      name: 'zeroRewardAmount';
      msg: 'Calculated reward amount is zero.';
    },
    {
      code: 6020;
      name: 'invalidFeeDestinationOwner';
      msg: 'Fee destination token account owner does not match contest fee destination.';
    },
    {
      code: 6021;
      name: 'noFeeToClaim';
      msg: 'No protocol fee to claim.';
    },
    {
      code: 6022;
      name: 'bumpError';
      msg: 'Failed to get bump seed.';
    },
    {
      code: 6023;
      name: 'internalError';
      msg: 'Internal error during calculation.';
    },
    {
      code: 6024;
      name: 'incorrectNumberOfAccounts';
      msg: 'Incorrect number of accounts provided.';
    },
    {
      code: 6025;
      name: 'invalidContentId';
      msg: 'Invalid content ID provided.';
    },
  ];
  types: [
    {
      name: 'content';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'contest';
            type: 'pubkey';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'url';
            type: 'string';
          },
          {
            name: 'cumulativeVotes';
            type: 'u64';
          },
          {
            name: 'id';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'contentAdded';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'contest';
            type: 'pubkey';
          },
          {
            name: 'contentId';
            type: 'u64';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'url';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'contest';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'prizeMint';
            type: 'pubkey';
          },
          {
            name: 'prizeVault';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeDestination';
            type: 'pubkey';
          },
          {
            name: 'startTime';
            type: 'i64';
          },
          {
            name: 'endTime';
            type: 'i64';
          },
          {
            name: 'winnerShares';
            type: {
              vec: 'u16';
            };
          },
          {
            name: 'protocolFeePercentage';
            type: 'u16';
          },
          {
            name: 'contentCount';
            type: 'u64';
          },
          {
            name: 'contestEnded';
            type: 'bool';
          },
          {
            name: 'claimedMask';
            type: 'u128';
          },
          {
            name: 'totalPrize';
            type: 'u64';
          },
          {
            name: 'protocolFee';
            type: 'u64';
          },
          {
            name: 'winnerIds';
            type: {
              vec: 'u64';
            };
          },
          {
            name: 'seed';
            type: 'u8';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'vaultBump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'newContest';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'contest';
            type: 'pubkey';
          },
          {
            name: 'startTime';
            type: 'i64';
          },
          {
            name: 'endTime';
            type: 'i64';
          },
          {
            name: 'oneOff';
            type: 'bool';
          },
        ];
      };
    },
    {
      name: 'tokenSwept';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'transferFailed';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            type: 'pubkey';
          },
          {
            name: 'to';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'voteRecord';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'voter';
            type: 'pubkey';
          },
          {
            name: 'content';
            type: 'pubkey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'voterVoted';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'contest';
            type: 'pubkey';
          },
          {
            name: 'voter';
            type: 'pubkey';
          },
          {
            name: 'contentId';
            type: 'u64';
          },
          {
            name: 'votingPower';
            type: 'u64';
          },
        ];
      };
    },
  ];
  constants: [
    {
      name: 'contentSeed';
      type: 'bytes';
      value: '[99, 111, 110, 116, 101, 110, 116]';
    },
    {
      name: 'contestSeed';
      type: 'bytes';
      value: '[99, 111, 110, 116, 101, 115, 116]';
    },
    {
      name: 'vaultSeed';
      type: 'bytes';
      value: '[118, 97, 117, 108, 116]';
    },
    {
      name: 'voteSeed';
      type: 'bytes';
      value: '[118, 111, 116, 101]';
    },
  ];
};
