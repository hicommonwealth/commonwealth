import { VALIDATION_MESSAGES } from 'client/scripts/helpers/formValidations/messages';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWForm } from 'client/scripts/views/components/component_kit/new_designs/CWForm';
import React, { useState } from 'react';
import {
  CWImageInput,
  ImageBehavior,
} from 'views/components/component_kit/CWImageInput';
import { CWText } from 'views/components/component_kit/cw_text';
import { z } from 'zod';

const CWImageInputShowCase = () => {
  const sampleImageUrl =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDn-lJCm6BAMW7tP9breo15R6FVpUaU6KrKg&s';

  const [imageBehavior1, setImageBehavior1] = useState(ImageBehavior.Circle);
  const [imageBehavior2, setImageBehavior2] = useState(ImageBehavior.Circle);
  const [imageBehavior3, setImageBehavior3] = useState(ImageBehavior.Circle);

  return (
    <>
      <CWText type="h5">Image upload (default)</CWText>
      <div className="flex-row">
        <CWImageInput />
      </div>
      <CWText type="h5">Image upload and image generation</CWText>
      <div className="flex-row">
        <CWImageInput withAIImageGeneration />
      </div>
      <CWText type="h5">Image Behavior</CWText>
      <div className="flex-row">
        <CWImageInput
          withAIImageGeneration
          canSelectImageBehavior
          imageURL={sampleImageUrl}
          imageBehavior={imageBehavior1}
          onImageBehaviorChange={setImageBehavior1}
          allowedImageBehaviours={['Circle', 'Fill', 'Tiled']}
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
              <CWImageInput
                withAIImageGeneration
                canSelectImageBehavior
                name="imageURL"
                hookToForm
                imageBehavior={imageBehavior2}
                onImageBehaviorChange={setImageBehavior2}
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
      <CWText type="h5">Switch b/w processed images</CWText>
      <div className="flex-row">
        <CWImageInput
          withAIImageGeneration
          canSelectImageBehavior
          imageURL={sampleImageUrl}
          imageBehavior={imageBehavior3}
          onImageBehaviorChange={setImageBehavior3}
          onProcessedImagesListChange={(processedImages) =>
            console.log('processedImages => ', processedImages)
          }
          canSwitchBetweenProcessedImages={true}
        />
      </div>
      <CWText type="h5">Disabled</CWText>
      <div className="flex-row">
        <CWImageInput disabled />
        <CWImageInput disabled withAIImageGeneration />
      </div>
    </>
  );
};

export default CWImageInputShowCase;
