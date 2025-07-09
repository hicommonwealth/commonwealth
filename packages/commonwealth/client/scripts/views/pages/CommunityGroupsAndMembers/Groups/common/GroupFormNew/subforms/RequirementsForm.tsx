import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import React from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { z } from 'zod';

const requirementTypeOptions = [
  { label: 'Token Threshold', value: 'threshold' },
  { label: 'Trust Level', value: 'trust-level' },
];

interface RequirementsFormProps {
  groupState:
    | z.infer<typeof CreateGroup.input>
    | z.infer<typeof UpdateGroup.input>;
  setGroupState: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}

const MAX_REQUIREMENTS = 10;

const RequirementsForm: React.FC<RequirementsFormProps> = ({
  groupState,
  setGroupState,
  errors,
}) => {
  // Use requirements directly from schema
  const requirements = (groupState.requirements || []).filter(
    (r) => r.rule !== 'allow',
  );

  const handleTypeChange = (idx: number, value: string) => {
    setGroupState((prev) => {
      const newReqs = [...(prev.requirements || [])];
      newReqs[idx] =
        value === 'threshold'
          ? { rule: 'threshold', data: { threshold: '', source: {} } }
          : {
              rule: 'trust-level',
              data: { minimum_trust_level: 2, sso_required: [] },
            };
      return { ...prev, requirements: newReqs };
    });
  };

  const handleFieldChange = (idx: number, field: string, value: any) => {
    setGroupState((prev) => {
      const newReqs = [...(prev.requirements || [])];
      newReqs[idx] = {
        ...newReqs[idx],
        data: { ...newReqs[idx].data, [field]: value },
      };
      return { ...prev, requirements: newReqs };
    });
  };

  const addRequirement = () => {
    setGroupState((prev) => ({
      ...prev,
      requirements: [
        ...(prev.requirements || []),
        { rule: 'threshold', data: { threshold: '', source: {} } },
      ],
    }));
  };

  const removeRequirement = (idx: number) => {
    setGroupState((prev) => {
      const newReqs = [...(prev.requirements || [])];
      newReqs.splice(idx, 1);
      return { ...prev, requirements: newReqs };
    });
  };

  return (
    <section className="form-section">
      <div className="header-row">
        <CWText type="h3" fontWeight="semiBold" className="header-text">
          Requirements
        </CWText>
        <CWText type="b2">Add requirements for access to gated topics</CWText>
      </div>
      <CWDivider />
      <section className="form-section">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className="requirement-panel"
            style={{ marginBottom: 16 }}
          >
            <CWSelectList
              label="Requirement Type"
              options={requirementTypeOptions}
              value={
                requirementTypeOptions.find((o) => o.value === req.rule) || null
              }
              onChange={(opt) => {
                if (opt) handleTypeChange(idx, opt.value);
              }}
            />
            {req.rule === 'threshold' && (
              <CWTextInput
                label="Threshold"
                value={req.data.threshold || ''}
                onChange={(e) =>
                  handleFieldChange(
                    idx,
                    'threshold',
                    (e as React.ChangeEvent<HTMLInputElement>).currentTarget
                      .value,
                  )
                }
              />
            )}
            {req.rule === 'trust-level' && (
              <CWSelectList
                label="Minimum Trust Level"
                options={[
                  { label: 'Level 1', value: 1 },
                  { label: 'Level 2', value: 2 },
                  { label: 'Level 3', value: 3 },
                  { label: 'Level 4', value: 4 },
                ]}
                value={{
                  label: `Level ${req.data.minimum_trust_level}`,
                  value: req.data.minimum_trust_level,
                }}
                onChange={(opt) => {
                  if (opt)
                    handleFieldChange(idx, 'minimum_trust_level', opt.value);
                }}
              />
            )}
            <CWButton
              label="Remove"
              type="button"
              buttonType="destructive"
              onClick={() => removeRequirement(idx)}
              style={{ marginTop: 8 }}
            />
          </div>
        ))}
        <CWButton
          disabled={requirements.length === MAX_REQUIREMENTS}
          type="button"
          label={
            requirements.length === MAX_REQUIREMENTS
              ? 'Cannot add more than 10 requirements'
              : 'Add requirement'
          }
          iconLeft={
            requirements.length === MAX_REQUIREMENTS ? undefined : 'plus'
          }
          buttonWidth="full"
          buttonType="secondary"
          buttonHeight="med"
          onClick={addRequirement}
        />
      </section>
    </section>
  );
};

export default RequirementsForm;
