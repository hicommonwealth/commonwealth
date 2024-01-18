# Template Parser

```ts
import express from 'express';
import { validateAgainstSchema, validateSemanticRules } from './middleware'; // This can be a single validation helper? 

import { communityContractTemplateSchema } from './schema';  // How are we consuming our versioned OAS? 
import type { CommunityContractTemplateInstance } from '@hicommonwealth/model';


// Define interfaces for form fields and tx template

interface FormField {
  field_name: string;
  field_label?: string;
  field_type: string;
  field_value?: string;
  field_ref: string;
  formatter?: string;
}

interface TxTemplate {
  method: string;
  args: {
    target: string[];
    calldata: string[];
    values: (string | number)[][];
    description?: string;
  };
}

const router = express.Router();

router.post('/CommunityContractTemplate', async (req, res) => {
  // Validate the incoming JSON against the schema definition
  const schemaValidationResult = await validateAgainstSchema(req.body, communityContractTemplateSchema);
  if (!schemaValidationResult.valid) {
    return res.status(400).send({ error: 'Invalid request body', details: schemaValidationResult.errors });
  }

  // Validate the incoming JSON against a semantic ruleset 
  const semanticValidationResult = await validateSemanticRules(req.body);
  if (!semanticValidationResult.valid) {
    return res.status(400).send({ error: 'Invalid request body', details: semanticValidationResult.errors });
  }

  // Output the components needed to render the page into the template library
  const components = {
    address: req.body.address,
    amount: req.body.amount,
    title: req.body.title,
    description: req.body.description,
    // ...
  };
  // Save the template + components object to the template library

  return res.send({ success: true, components });
});

export default router;

// Define a function to parse the JSON payload and validate against the schema
function parseTemplate(json: any): { formFields: FormField[]; txTemplate: TxTemplate } {
  const valid = validate(json, schema);
  if (!valid) {
    throw new Error("JSON payload is invalid");
  }

  const formFields = json.form_fields as FormField[];
  const txTemplate = json.tx_template as TxTemplate;

 
```

## Change Log

- 231013: Flagged by Graham Johnson for certification.
- 230204: Authored by Forest Mars.
