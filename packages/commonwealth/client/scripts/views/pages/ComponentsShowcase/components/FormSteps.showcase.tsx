import React from 'react';
import CWFormSteps from 'views/components/component_kit/new_designs/CWFormSteps';

const FormStepsShowcase = () => {
  return (
    <>
      <CWFormSteps
        steps={[
          { label: 'First Step', state: 'completed' },
          { label: 'Second Step', state: 'active' },
          { label: 'Third Step', state: 'inactive' },
        ]}
      />
    </>
  );
};

export default FormStepsShowcase;
