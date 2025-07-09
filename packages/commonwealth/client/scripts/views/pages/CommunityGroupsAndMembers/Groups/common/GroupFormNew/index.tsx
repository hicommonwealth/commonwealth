import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { z } from 'zod';
import { groupValidationSchema } from '../GroupForm/validations';
import AllowlistForm from './subforms/AllowlistForm';
import BasicInfoForm from './subforms/BasicInfoForm';
import RequirementsForm from './subforms/RequirementsForm';
import RequirementsToFulfillForm from './subforms/RequirementsToFulfillForm';
import TopicsForm from './subforms/TopicsForm';
import { useGroupFormState } from './useGroupFormState';

export type GroupFormNewProps = {
  mode: 'create' | 'edit';
  initialValue:
    | z.infer<typeof CreateGroup.input>
    | z.infer<typeof UpdateGroup.input>;
  onSuccess?: () => void;
  topics?: { label: string; value: number }[];
};

const GroupFormNew = ({
  mode,
  initialValue,
  onSuccess,
  topics = [],
}: GroupFormNewProps) => {
  const {
    groupState,
    setGroupState,
    isDirty,
    isValid,
    handleSubmit,
    errors,
    isSubmitting,
  } = useGroupFormState({ mode, initialValue, onSuccess });

  // Exclude allowlist from requirements count
  const requirementsCount = (groupState.requirements || []).filter(
    (r) => r.rule !== 'allow',
  ).length;

  return (
    <CWPageLayout>
      <CWForm
        onSubmit={handleSubmit}
        className="GroupForm"
        validationSchema={groupValidationSchema}
      >
        <BasicInfoForm
          groupState={groupState}
          setGroupState={setGroupState}
          errors={errors}
        />
        <RequirementsToFulfillForm
          requirementsCount={requirementsCount}
          requiredRequirements={groupState.metadata?.required_requirements}
          setRequiredRequirements={(val) =>
            setGroupState((prev) => ({
              ...prev,
              metadata: { ...prev.metadata, required_requirements: val },
            }))
          }
        />
        <RequirementsForm
          groupState={groupState}
          setGroupState={setGroupState}
          errors={errors}
        />
        <AllowlistForm
          groupState={groupState}
          setGroupState={setGroupState}
          errors={errors}
        />
        <TopicsForm
          groupState={groupState}
          setGroupState={setGroupState}
          errors={errors}
          topics={topics}
        />
        {/* ...other subforms as needed */}
        <div className="action-buttons">
          <CWButton
            type="submit"
            buttonWidth="wide"
            disabled={!isDirty || !isValid || isSubmitting}
            label={mode === 'create' ? 'Create group' : 'Save changes'}
          />
        </div>
      </CWForm>
    </CWPageLayout>
  );
};

export default GroupFormNew;
