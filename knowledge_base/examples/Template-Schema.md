# Template Schema

```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "type": "object",

  /* top level object */
  "properties": {
    "form_fields": {
      "type": "array",
      "items": { 
 "oneOf": [
   { "$ref": "#/$defs/divider" },
   { "$ref": "#/$defs/text" },
   { "$ref": "#/$defs/input" },
   { "$ref": "#/$defs/dropdown" }
 ]
      }
    },
    "tx_template": {
      "type": "object",
      "properties": {
        "method": { "type": "string" },
        "args": { "type": "object" }
      },
      "required": [ "method" ],
      "additionalProperties": false
    }
  },
  "required": [
    "form_fields",
    "tx_template"
  ],
  "additionalProperties": false,

  /* component definitions */
  "$defs": {
    /* shared formatter property, used in input and dropdown*/
    "formatter": {
      "type": "string",
      "enum": [
        "number",
        "string",
        "address",
        "token"
      ]
    },
    "divider": {
      "type": "object",
      "properties": {
        "divider": {
          "type": "object",
          "properties": {
            "field_name": { "type": "string" }
          },
          "required": [
            "field_name"
          ],
          "additionalProperties": false
        }
      },
      "required": [ "divider" ],
      "additionalProperties": false
    },
    "text": {
      "type": "object",
      "properties": {
        "text": {
          "type": "object",
          "properties": {
            "field_name": { "type": "string" },
            "field_value": { "type": "string" },
            "field_type": {
              "type": "string",
              "enum": [
                "h1",
                "h2",
                "h3",
                "text"
              ]
            }
          },
          "required": [
            "field_name",
            "field_value"
          ],
          "additionalProperties": false
        }
      },
      "required": [ "text" ],
      "additionalProperties": false
    },
    "input": {
      "type": "object",
      "properties": {
        "input": {
          "type": "object",
          "properties": {
            "field_name": { "type": "string" },
            "field_label": { "type": "string" },
            "field_value": { "type": "string" },
            "field_ref": { "type": "string" },
            "formatter": { "$ref": "#/$defs/formatter" }
          },
          "required": [
            "field_name",
            "field_label",
            "field_ref"
          ],
          "additionalProperties": false
        }
      },
      "required": [ "input" ],
      "additionalProperties": false
    },
    "dropdown": {
      "type": "object",
      "properties": {
        "dropdown": {
          "type": "object",
          "properties": {
            "field_name": { "type": "string" },
            "field_label": { "type": "string" },
            "field_value": { "type": "string" },
            "field_ref": { "type": "string" },
            "formatter": { "$ref": "#/$defs/formatter" },
            "field_options": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "label": {
                    "type": "string"
                  },
                  "value": {
                    "type": "string"
                  }
                }
              }
            }
          },
          "required": [
            "field_name",
            "field_label",
            "field_ref",
            "field_options"
          ],
          "additionalProperties": false
        }
      },
      "required": [ "dropdown" ],
      "additionalProperties": false
    }
  }
}
```

## Change Log

- 231013: Flagged by Graham Johnson for certification (see also `Template-Schema.v0.1`)
- 230204: Authored by Forest Mars.
