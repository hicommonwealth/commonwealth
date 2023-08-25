``` // Marshal the JSON values into the method signature in the calldata field
  const marshalledValues = formFields.reduce((acc, formField) => {
    const fieldRef = formField.field_ref;
    const fieldValue = formField.field_value;
    if (fieldValue) {
      acc[fieldRef] = fieldValue;
    }
    return acc;
  }, {} as { [key: string]: string });

  const marshalledCalldata = txTemplate.args.calldata.map((field) => {
    return marshalledValues[field];
  });
```