# Template Schema v0.1

```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "type": "object",
  "refs": {
    "template": {
      "type": "object",
      "properties": {
        "field_name": {
          "type": "string"
        },
        "field_label": {
          "type": "string"
        },
        "field_type": {
          "type": "string",
          "enum": [
            "text",
            "input",
            "divider",
            "h1",
            "h2"
          ]
        },
        "field_ref": {
          "type": "string"
        }
      },
      "required": [
        "field_name",
        "field_type",
      ]
    }
  },
  "properties": {
    "form_fields": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/template"
      }
    },
    "tx_template": {
      "type": "object",
      "properties": {
        "name": {
          "$ref": "#/refs/template/properties/field_ref"
        },
        "address": {
          "$ref": "#/refs/template/properties/field_ref"
        },
        "amount": {
          "$ref": "#/refs/template/properties/field_ref"
        }
      },
      "required": [
        "recipient",
        "address",
        "amount"
      ]
    }
  },
  "required": [
    "form_fields",
    "tx_template"
  ]
}
```

## Change Log

- 231013: Flagged by Graham Johnson for certification.
- 230204: Authored by Forest Mars.
