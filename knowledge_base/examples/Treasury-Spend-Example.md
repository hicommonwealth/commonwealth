# Treasury Spend Example

```json
{
  "form_fields": [
    {
      "text": {
        "field_name": "title",
        "field_type": "h1",
        "field_value": "Create a New Treasury Spend Proposal"
      }
    },
    {
      "input": {
        "field_name": "name",
        "field_label": "Enter a name for your (beer related) proposal",
        "field_ref": "name-ref",
        "formatter": "string"
      }
    },
    {
      "input": {
        "field_name": "description",
        "field_label": "Enter a short description for your proposal",
        "field_ref": "description-ref"
      }
    },
    {
      "divider": {
        "field_name": "divider",
      }
    },
    {
      "dropdown": {
        "field_name": "treasury dropdown",
        "field_label": "Select which Treasury to spend from",
        "field_options": [{ "label": "Treasury1", "value": "0x123" }, { "label": "Rhys' Wallet", "value": "0xRhys" }],
        "formatter": "address",
        "field_ref": "treasury-select-ref"
      }
    },
    {
      "text": {
        "field_name": "subtitle",
        "field_type": "h2",
        "field_value": "Treasury Spend"
      }
    },
    {
      "input": {
        "field_name": "address",
        "field_label": "Who's the recipient?",
        "field_ref": "address-ref",
        "formatter": "address"
      }
    },
    {
      "input": {
        "field_name": "amount",
        "field_label": "How much are they getting for beer?",
        "field_ref": "amount-ref",
        "formatter": "token"
      }
    }
  ],
  "tx_template": {
    "method": "propose",
    "args": {
      "target": [
        "0x0urdaotrez"
      ],
      "calldata": [
        "sendTo"
      ],
      "values": [
        [
          "$address-ref",
          "$amount-ref"
        ]
      ],
      "description": "$description-ref"
    }
  }
}
```
