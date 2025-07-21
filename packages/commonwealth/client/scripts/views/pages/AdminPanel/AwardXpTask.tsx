import { AwardXp } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import React, { useState } from 'react';
import app from 'state';
import useAwardXpMutation from 'state/api/superAdmin/awardXp';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWUserPicker, {
  CWUserPickerOption,
} from 'views/components/component_kit/new_designs/CWUserPicker/CWUserPicker';
import { z } from 'zod';
import './AdminPanel.scss';

const schema = AwardXp.input;

type FormState = z.infer<typeof schema>;

const initialState: Omit<FormState, 'xp_amount'> & { xp_amount: string } = {
  user_id: 0,
  xp_amount: '',
  reason: '',
};

const AwardXpTask = () => {
  const [form, setForm] = useState<typeof initialState>(initialState);
  const [, setTouched] = useState<{ [K in keyof FormState]?: boolean }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { mutateAsync, isPending } = useAwardXpMutation();

  const communityId = app.activeChainId() || '';
  const handleUserSelect = (user: CWUserPickerOption | null) => {
    setForm((f) => ({ ...f, user_id: user ? Number(user.value) : 0 }));
    setTouched((t) => ({ ...t, user_id: true }));
  };

  const handleChange = (field: keyof typeof initialState, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleCancel = () => {
    setForm(initialState);
    setTouched({});
  };

  // Refactor handleSubmit to not be async directly
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    (async () => {
      try {
        // Convert xp_amount to number for validation/submission
        const toValidate = {
          ...form,
          xp_amount: form.xp_amount === '' ? 0 : Number(form.xp_amount),
        };
        schema.parse(toValidate);
        await mutateAsync(toValidate);
        notifySuccess('XP awarded successfully');
        handleCancel();
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
    })();
  };

  const toValidate = {
    ...form,
    xp_amount: form.xp_amount === '' ? 0 : Number(form.xp_amount),
  };
  const validation = schema.safeParse(toValidate);
  const isValid = validation.success;

  return (
    <div className="TaskGroup">
      <CWText type="h4">Award Manual XP</CWText>
      <form onSubmit={handleSubmit}>
        <div className="TaskRow">
          <CWUserPicker
            value={form.user_id}
            onChange={handleUserSelect}
            communityId={communityId}
            placeholder="Search user by name or ID..."
          />
          <CWTextInput
            value={form.xp_amount}
            onInput={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                handleChange('xp_amount', val);
              }
            }}
            onBlur={() => setTouched((t) => ({ ...t, xp_amount: true }))}
            label="Amount"
            placeholder="XP (1-10,000)"
          />
        </div>
        <div className="TaskRow">
          <CWTextInput
            value={form.reason}
            onInput={(e) => handleChange('reason', e.target.value)}
            label="Reason"
            placeholder="Enter reason for awarding XP"
          />
        </div>
        <div className="TaskRow buttons">
          <CWButton
            label="Award XP"
            buttonType="primary"
            type="submit"
            disabled={!isValid || isPending}
          />
        </div>
        {errorMsg && <CWValidationText message={errorMsg} />}
      </form>
    </div>
  );
};

export default AwardXpTask;
