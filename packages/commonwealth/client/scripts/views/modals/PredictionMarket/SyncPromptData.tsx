import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Syncs AI-generated prompt into the form; must be rendered inside CWForm (FormProvider).
 */
export const SyncPromptData = ({ promptData }: { promptData: string }) => {
  const { setValue } = useFormContext();
  useEffect(() => {
    if (promptData !== undefined && promptData !== '') {
      setValue('prompt', promptData, { shouldDirty: true });
    }
  }, [promptData, setValue]);
  return null;
};
