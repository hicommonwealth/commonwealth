import { buildUpdateCommunityInput } from 'client/scripts/state/api/communities/updateCommunity';
import { notifySuccess } from 'controllers/app/notifications';
import { linkValidationSchema } from 'helpers/formValidations/common';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useCallback, useState } from 'react';
import app from 'state';
import {
  useGetCommunityByIdQuery,
  useUpdateCommunityMutation,
} from 'state/api/communities';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { ZodError } from 'zod';
import './CustomTOS.scss';

const CustomTOS = () => {
  const communityId = app.activeChainId() || '';
  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityByIdQuery({
      id: communityId,
      enabled: !!communityId,
    });

  const { mutateAsync: updateCommunity } = useUpdateCommunityMutation({
    communityId: community?.id || '',
  });

  useRunOnceOnCondition({
    callback: () => {
      setTerms({
        value: community?.terms || '',
        error: '',
      });
    },
    shouldRun: !isLoadingCommunity && !!community,
  });

  const [terms, setTerms] = useState({
    value: '',
    error: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const onInputChange = useCallback((event) => {
    const value = event?.target?.value?.trim() || '';
    let error = '';

    if (value) {
      try {
        linkValidationSchema.required.parse(value);
      } catch (e: any) {
        const zodError = e as ZodError;
        error = zodError.errors[0].message;
      }
    }

    setTerms({ error, value });
  }, []);

  const onSaveChanges = useCallback(async () => {
    if (isSaving || terms.error || !community?.id) return;
    setIsSaving(true);

    try {
      await updateCommunity(
        buildUpdateCommunityInput({
          communityId: community?.id,
          terms: terms.value || '',
        }),
      );

      notifySuccess('TOS link updated!');
    } catch {
      notifySuccess('Failed to update TOS link!');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, terms, community, updateCommunity]);

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
