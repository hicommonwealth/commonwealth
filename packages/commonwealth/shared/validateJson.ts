import validator from 'is-my-json-valid';

const schema = {
  type: 'object',
  properties: {
    form_fields: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: '#/$defs/divider' },
          { $ref: '#/$defs/text' },
          { $ref: '#/$defs/input' },
          { $ref: '#/$defs/dropdown' },
          { $ref: '#/$defs/function' },
          { $ref: '#/$defs/struct' },
        ],
      },
    },
    tx_template: {
      type: 'object',
      properties: {
        method: { type: 'string' },
        args: { type: 'object' },
        tx_params: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            gas: { type: 'string' },
            gasPrice: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      required: ['method'],
      additionalProperties: false,
    },
  },
  required: ['form_fields', 'tx_template'],
  additionalProperties: false,

  /* component definitions */
  $defs: {
    /* shared formatter property, used in input and dropdown*/
    formatter: {
      type: 'string',
      enum: ['number', 'string', 'address', 'token'],
    },
    divider: {
      type: 'object',
      properties: {
        divider: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
          },
          required: ['field_name'],
          additionalProperties: false,
        },
      },
      required: ['divider'],
      additionalProperties: false,
    },
    text: {
      type: 'object',
      properties: {
        text: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
            field_value: { type: 'string' },
            field_type: {
              type: 'string',
              enum: ['h1', 'h2', 'h3', 'h4', 'text'],
            },
          },
          required: ['field_name', 'field_value'],
          additionalProperties: false,
        },
      },
      required: ['text'],
      additionalProperties: false,
    },
    input: {
      type: 'object',
      properties: {
        input: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
            field_label: { type: 'string' },
            field_value: { type: 'string' },
            field_ref: { type: 'string' },
            formatter: { $ref: '#/$defs/formatter' },
          },
          required: ['field_name', 'field_label', 'field_ref'],
          additionalProperties: false,
        },
      },
      required: ['input'],
      additionalProperties: false,
    },
    method: {
      type: 'object',
      properties: {
        functionABI: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            inputs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: ['name', 'type'],
                  additionalProperties: false,
                },
              },
            },
            required: ['name', 'type', 'inputs'],
            additionalProperties: false,
          },
        },
        paramRefs: { type: 'array', items: { type: 'string' } },
        form: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: '#/$defs/divider' },
              { $ref: '#/$defs/text' },
              { $ref: '#/$defs/input' },
              { $ref: '#/$defs/dropdown' },
            ],
          },
        },
        required: ['functionABI', 'paramRefs', 'form'],
        additionalProperties: false,
      },
    },
    function: {
      type: 'object',
      properties: {
        function: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
            field_label: { type: 'string' },
            field_ref: { type: 'string' },
            tx_forms: { type: 'array', items: { $ref: '#/$defs/method' } },
          },
          required: ['field_name', 'field_label', 'field_ref', 'tx_forms'],
          additionalProperties: false,
        },
      },
      required: ['function'],
      additionalProperties: false,
    },
    struct: {
      type: 'object',
      properties: {
        struct: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
            field_label: { type: 'string' },
            field_ref: { type: 'string' },
            form_fields: {
              type: 'array',
              items: {
                oneOf: [
                  { $ref: '#/$defs/divider' },
                  { $ref: '#/$defs/text' },
                  { $ref: '#/$defs/input' },
                  { $ref: '#/$defs/dropdown' },
                  { $ref: '#/$defs/function' },
                  { $ref: '#/$defs/struct' },
                ],
              },
            },
          },
          required: ['field_name', 'field_label', 'field_ref', 'form_fields'],
          additionalProperties: false,
        },
      },
      required: ['struct'],
      additionalProperties: false,
    },
    dropdown: {
      type: 'object',
      properties: {
        dropdown: {
          type: 'object',
          properties: {
            field_name: { type: 'string' },
            field_label: { type: 'string' },
            field_value: { type: 'string' },
            field_ref: { type: 'string' },
            formatter: { $ref: '#/$defs/formatter' },
            field_options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                  },
                  value: {
                    type: 'string',
                  },
                },
              },
            },
          },
          required: ['field_name', 'field_label', 'field_ref', 'field_options'],
          additionalProperties: false,
        },
      },
      required: ['dropdown'],
      additionalProperties: false,
    },
  },
};

type AnyKeyAnyValue = Record<string, any>;

export default function isValidJson(data: AnyKeyAnyValue): boolean {
  const validate = validator(JSON.parse(JSON.stringify(schema)));
  return validate(data);
}
