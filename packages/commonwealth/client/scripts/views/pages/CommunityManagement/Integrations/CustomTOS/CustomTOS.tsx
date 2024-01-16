import { notifySuccess } from 'client/scripts/controllers/app/notifications';
import React, { useCallback, useState } from 'react';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { ZodError } from 'zod';
import { linkValidationSchema } from '../common/validation';
import './CustomTOS.scss';

const CustomTOS = () => {
  const [community] = useState(app.config.chains.getById(app.activeChainId()));
  const [terms, setTerms] = useState({
    value: community.terms,
    error: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const onInputChange = useCallback((event) => {
    const value = event?.target?.value?.trim() || '';
    let error = '';

    try {
      linkValidationSchema.parse(value);
    } catch (e: any) {
      const zodError = e as ZodError;
      error = zodError.errors[0].message;
    }

    setTerms({ error, value });
  }, []);

  const onSaveChanges = useCallback(async () => {
    if (isSaving || terms.error) return;
    setIsSaving(true);

    try {
      await community.updateChainData({
        terms: terms.value,
      });

      notifySuccess('TOS link updated!');
    } catch {
      notifySuccess('Failed to update TOS link!');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, terms, community]);

  return (
    <section className="CustomTOS">
      <div className="header">
        <CWText type="h4">Custom terms of service</CWText>
        <CWText type="b1">
          Add a link to your community terms of service.
        </CWText>
      </div>

      <CWTextInput
        label="Custom Terms of Service"
        placeholder="https://"
        fullWidth
        value={terms.value}
        customError={terms.error}
        onInput={onInputChange}
      />

      <CWButton
        buttonType="secondary"
        label="Save Changes"
        onClick={onSaveChanges}
        disabled={
          isSaving || community?.terms?.trim?.() === terms?.value?.trim?.()
        }
      />
    </section>
  );
};

export default CustomTOS;
