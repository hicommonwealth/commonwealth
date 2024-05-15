export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    ContractSource: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['erc20', 'erc721', 'erc1155', 'spl'],
        },
        evm_chain_id: {
          type: 'number',
        },
        contract_address: {
          type: 'string',
        },
        token_id: {
          type: 'string',
          pattern: '^[0-9]+$',
        },
      },
      required: ['source_type', 'evm_chain_id', 'contract_address'],
      if: {
        properties: {
          source_type: {
            const: 'spl',
          },
        },
      },
      then: {
        properties: {
          contract_address: {
            pattern: '^[a-zA-Z0-9]{32,44}$',
          },
        },
      },
      else: {
        properties: {
          contract_address: {
            pattern: '^0x[a-fA-F0-9]{40}$',
          },
        },
      },
    },
    NativeSource: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['eth_native'],
        },
        evm_chain_id: {
          type: 'number',
        },
      },
      required: ['source_type', 'evm_chain_id'],
    },
    CosmosSource: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['cosmos_native'],
        },
        cosmos_chain_id: {
          type: 'string',
        },
        token_symbol: {
          type: 'string',
        },
      },
      required: ['source_type', 'cosmos_chain_id', 'token_symbol'],
    },
    CosmosContractSource: {
      type: 'object',
      properties: {
        source_type: {
          type: 'string',
          enum: ['cw20', 'cw721'],
        },
        cosmos_chain_id: {
          type: 'string',
        },
        contract_address: {
          type: 'string',
        },
      },
      required: ['source_type', 'cosmos_chain_id', 'contract_address'],
    },
    ThresholdData: {
      type: 'object',
      properties: {
        threshold: {
          type: 'string',
          pattern: '^[0-9]+$',
        },
        source: {
          oneOf: [
            { $ref: '#/definitions/ContractSource' },
            { $ref: '#/definitions/NativeSource' },
            { $ref: '#/definitions/CosmosSource' },
            { $ref: '#/definitions/CosmosContractSource' },
          ],
        },
      },
      required: ['threshold', 'source'],
    },
    AllowlistData: {
      type: 'object',
      properties: {
        allow: {
          type: 'array',
          items: {
            type: 'string',
            pattern: '^0x[a-fA-F0-9]{40}$',
          },
        },
      },
      required: ['allow'],
    },
  },
  type: 'array',
  items: {
    type: 'object',
    properties: {
      rule: {
        type: 'string',
        enum: ['threshold', 'allow'],
      },
      data: {
        oneOf: [
          { $ref: '#/definitions/ThresholdData' },
          { $ref: '#/definitions/AllowlistData' },
        ],
      },
    },
    required: ['rule', 'data'],
  },
  allOf: [
    {
      if: {
        properties: {
          rule: {
            const: 'threshold',
          },
        },
      },
      then: {
        properties: {
          data: {
            $ref: '#/definitions/ThresholdData',
          },
        },
      },
    },
    {
      if: {
        properties: {
          rule: {
            const: 'allow',
          },
        },
      },
      then: {
        properties: {
          data: {
            $ref: '#/definitions/AllowlistData',
          },
        },
      },
    },
  ],
};
