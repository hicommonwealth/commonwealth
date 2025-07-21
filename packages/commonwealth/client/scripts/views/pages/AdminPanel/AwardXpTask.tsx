import { AwardXp } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import useAwardXpMutation from 'state/api/superAdmin/awardXp';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'views/components/component_kit/new_designs/CWForm';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import CWUserPicker from 'views/components/component_kit/new_designs/CWUserPicker/CWUserPicker';
import { z } from 'zod';
import './AdminPanel.scss';

const schema = AwardXp.input;

type FormState = z.infer<typeof schema>;

const initialState: FormState = {
  user_id: 0,
  xp_amount: 1, // <-- set to minimum valid value
  reason: '',
};

const AwardXpTask = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutateAsync, isPending } = useAwardXpMutation();
  const communityId = app.activeChainId() || '';

  const handleSubmit = async (values: FormState) => {
    setErrorMsg(null);
    try {
      await mutateAsync(values);
      notifySuccess('XP awarded successfully');
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setErrorMsg('Please fix form errors');
        notifyError('Please fix form errors');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
        notifyError(err.message);
      } else {
        setErrorMsg('Failed to award XP');
        notifyError('Failed to award XP');
      }
    }
  };

  const handleErrors = (_errors: any) => {
    setErrorMsg('Please fix form errors');
  };

  return (
    <div className="TaskGroup">
      <CWText type="h4">Award Manual XP</CWText>
      <CWForm
        validationSchema={schema}
        initialValues={initialState}
        onSubmit={handleSubmit}
        onErrors={handleErrors}
        className="AwardXpForm"
      >
        {(formMethods) => {
          const { setValue, watch, formState } = formMethods;
          const user_id = watch('user_id');
          return (
            <>
              <div className="TaskRow">
                <CWUserPicker
                  value={user_id}
                  onChange={(user) =>
                    setValue('user_id', user ? Number(user.value) : 0, {
                      shouldDirty: true,
                    })
                  }
                  communityId={communityId}
                  placeholder="Search user by name or ID..."
                />
                <CWTextInput
                  name="xp_amount"
                  hookToForm
                  label="Amount"
                  placeholder="XP (1-10,000)"
                  type="number"
                />
              </div>
              <div className="TaskRow">
                <CWTextInput
                  name="reason"
                  hookToForm
                  label="Reason"
                  placeholder="Enter reason for awarding XP"
                />
              </div>
              <div className="TaskRow buttons">
                <CWButton
                  label="Award XP"
                  buttonType="primary"
                  type="submit"
                  disabled={!formState.isValid || isPending}
                />
              </div>
              {errorMsg && <CWValidationText message={errorMsg} />}
            </>
          );
        }}
      </CWForm>
    </div>
  );
};

export default AwardXpTask;
