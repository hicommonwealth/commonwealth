import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWForm,
  CWFormRef,
} from 'views/components/component_kit/new_designs/CWForm';
import { termsOfServicesFormValidation } from './validations';

import './TermsOfServicesStep.scss';

type TermsOfServicesStepProps = {
  onComplete: () => void;
};

const TermsOfServicesStep = ({ onComplete }: TermsOfServicesStepProps) => {
  const formMethodsRef = useRef<CWFormRef>();

  const handleSubmit = () => {
    onComplete();
  };

  return (
    <CWForm
      // @ts-expect-error <StrictNullChecks/>
      ref={formMethodsRef}
      className="TermsOfServicesStep"
      initialValues={{
        enableTermsOfServices: true,
      }}
      validationSchema={termsOfServicesFormValidation}
      onSubmit={handleSubmit}
    >
      {({ watch }) => {
        const isTermsChecked = watch('enableTermsOfServices');
        return (
          <React.Fragment>
            <iframe
              className="terms-frame"
              allowFullScreen={true}
              src={`${window.location.origin}/terms`}
              loading="eager"
            />

            <div className="notification-section">
              <CWCheckbox
                name="enableTermsOfServices"
                hookToForm
                label="I agree to the Common Terms of Service"
              />
            </div>

            <CWButton
              label="Next"
              buttonWidth="full"
              type="submit"
              disabled={!isTermsChecked}
            />

            <CWText isCentered className="footer">
              We will never share your contact information with third-party
              services.
              <br />
              For questions, please review our&nbsp;
              <Link to="/privacy">Privacy Policy</Link>
            </CWText>
          </React.Fragment>
        );
      }}
    </CWForm>
  );
};

export { TermsOfServicesStep };
