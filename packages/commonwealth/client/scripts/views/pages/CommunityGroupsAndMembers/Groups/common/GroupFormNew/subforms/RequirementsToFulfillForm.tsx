import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';

interface RequirementsToFulfillFormProps {
  requirementsCount: number;
  requiredRequirements: number | null | undefined;
  setRequiredRequirements: (val: number | null) => void;
  error?: string;
}

const RequirementsToFulfillForm: React.FC<RequirementsToFulfillFormProps> = ({
  requirementsCount,
  requiredRequirements,
  setRequiredRequirements,
  error,
}) => {
  const isAll =
    !requiredRequirements || requiredRequirements === requirementsCount;
  const options = Array.from({ length: requirementsCount }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));

  return (
    <section className="form-section">
      <CWText
        type="h4"
        fontWeight="semiBold"
        className="header-row header-text"
      >
        Necessary requirements
      </CWText>
      <div className="radio-buttons">
        <CWRadioButton
          label="All requirements must be satisfied"
          value="all"
          name="requirementsToFulfill"
          checked={isAll}
          onChange={() => setRequiredRequirements(requirementsCount)}
        />
        <CWRadioButton
          label={
            <span className="requirements-radio-btn-label">
              Minimum number of conditions to join{' '}
              <CWSelectList
                isDisabled={isAll}
                isSearchable={false}
                isClearable={false}
                options={options}
                value={
                  options.find((o) => o.value === requiredRequirements) ||
                  options[0]
                }
                onChange={(opt) => {
                  if (opt) setRequiredRequirements(opt.value);
                }}
              />
            </span>
          }
          value="n"
          name="requirementsToFulfill"
          checked={!isAll}
          onChange={() => setRequiredRequirements(1)}
        />
        {error && (
          <MessageRow
            hasFeedback
            statusMessage={error}
            validationStatus="failure"
          />
        )}
      </div>
    </section>
  );
};

export default RequirementsToFulfillForm;
