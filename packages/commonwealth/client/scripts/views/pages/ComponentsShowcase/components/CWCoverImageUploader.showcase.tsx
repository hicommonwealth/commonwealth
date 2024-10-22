import { VALIDATION_MESSAGES } from 'client/scripts/helpers/formValidations/messages';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'client/scripts/views/components/component_kit/new_designs/CWForm';
import React, { useState } from 'react';
import {
  CWCoverImageUploader,
  ImageBehavior,
} from 'views/components/component_kit/CWCoverImageUploader';
import { CWText } from 'views/components/component_kit/cw_text';
import { z } from 'zod';

const CWCoverImageUploaderShowCase = () => {
  const sampleImageUrl =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDn-lJCm6BAMW7tP9breo15R6FVpUaU6KrKg&s';

  const [imageBehavior, setImageBehavior] = useState(ImageBehavior.Circle);

  return (
    <>
      <CWText type="h5">Image upload (default)</CWText>
      <div className="flex-row">
        <CWCoverImageUploader />
      </div>
      <CWText type="h5">Image upload and image generation</CWText>
      <div className="flex-row">
        <CWCoverImageUploader withAIImageGeneration />
      </div>
      <CWText type="h5">Image Behavior</CWText>
      <div className="flex-row">
        <CWCoverImageUploader
          withAIImageGeneration
          canSelectImageBehavior
          imageURL={sampleImageUrl}
          imageBehavior={imageBehavior}
          onImageBehaviorChange={setImageBehavior}
        />
      </div>
      <CWText type="h5">Form validation</CWText>
      <div className="flex-row">
        <CWForm
          validationSchema={z.object({
            imageURL: z
              .string()
              .nonempty({ message: VALIDATION_MESSAGES.NO_INPUT }),
          })}
          onSubmit={(values) => console.log('values => ', values)}
          onErrors={(errors) => console.log('errors => ', errors)}
          className="w-full"
        >
          {({ setValue }) => (
            <>
              <CWCoverImageUploader
                withAIImageGeneration
                canSelectImageBehavior
                name="imageURL"
                hookToForm
                imageBehavior={imageBehavior}
                onImageBehaviorChange={setImageBehavior}
                onImageGenerated={console.log}
                onImageUploaded={console.log}
                onImageProcessingChange={console.log}
              />
              <CWButton
                label="Trigger manual image update"
                type="button"
                buttonWidth="full"
                containerClassName="mt-16"
                onClick={() =>
                  setValue('imageURL', sampleImageUrl, { isDirty: true })
                }
              />
              <CWButton
                label="Submit"
                type="submit"
                buttonWidth="full"
                containerClassName="mt-16"
              />
            </>
          )}
        </CWForm>
      </div>
      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWCoverImageUploader disabled />
        <CWCoverImageUploader disabled withAIImageGeneration />
      </div>
    </>
  );
};

export default CWCoverImageUploaderShowCase;
