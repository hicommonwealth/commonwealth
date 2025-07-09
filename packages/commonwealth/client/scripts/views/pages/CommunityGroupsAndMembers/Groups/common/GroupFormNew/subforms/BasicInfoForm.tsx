import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { z } from 'zod';

interface BasicInfoFormProps {
  groupState:
    | z.infer<typeof CreateGroup.input>
    | z.infer<typeof UpdateGroup.input>;
  setGroupState: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  groupState,
  setGroupState,
  errors,
}) => {
  return (
    <section className="form-section">
      <CWText type="h3" fontWeight="semiBold" className="header-text">
        Basic information
      </CWText>
      <CWTextInput
        name="metadata.name"
        label="Group name"
        placeholder="Group name"
        fullWidth
        instructionalMessage="Can be up to 40 characters long"
        value={groupState.metadata?.name || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setGroupState((prev) => ({
            ...prev,
            metadata: { ...prev.metadata, name: e.target.value },
          }))
        }
        customError={errors?.['metadata.name']}
      />
      <CWTextArea
        name="metadata.description"
        label="Description (optional)"
        placeholder="Add a description for your group"
        instructionalMessage="Can be up to 250 characters long"
        value={groupState.metadata?.description || ''}
        onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setGroupState((prev) => ({
            ...prev,
            metadata: { ...prev.metadata, description: e.target.value },
          }))
        }
        customError={errors?.['metadata.description']}
      />
      <CWImageInput
        label="Group Image (Accepts JPG and PNG files)"
        name="metadata.groupImageUrl"
        imageBehavior={ImageBehavior.Circle}
        imageURL={groupState.metadata?.groupImageUrl || ''}
        onImageUploaded={(url) =>
          setGroupState((prev) => ({
            ...prev,
            metadata: { ...prev.metadata, groupImageUrl: url },
          }))
        }
        withAIImageGeneration
      />
    </section>
  );
};

export default BasicInfoForm;
