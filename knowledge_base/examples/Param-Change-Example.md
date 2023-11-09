# Param Change Example

```json
{
  "form_fields": [
    {
      "text": {
        "field_name": "title",
        "field_type": "h1",
        "field_value": "Create a New Proposal"
      }
    },
    {
      "input": {
        "field_name": "name",
        "field_label": "Enter proposal title",
        "field_ref": "name-ref",
        "formatter": "string"
      }
    },
    {
      "divider": {
        "field_name": "divider"
      }
    },
    {
      "text": {
        "field_name": "subtitle",
        "field_type": "h2",
        "field_value": "Parameter Change: Set Tax"
      }
    },
    {
      "input": {
        "field_name": "tax man tax man",
        "field_label": "Set the tax man",
        "field_ref": "tax-ref",
        "formatter": "number"
      }
    }
  ],
  "tx_template": {
    "method": "propose",
    "args": {
      "target": [
        "0xProtocolAddress"
      ],
      "calldata": [
        "setTax"
      ],
      "values": [
        "$tax-ref"
      ],
      "description": "$name-ref"
    }
  }
}
```
