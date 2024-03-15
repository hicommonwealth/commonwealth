import { ArrowCircleRight, MagnifyingGlass } from '@phosphor-icons/react';
import { notifySuccess } from 'controllers/app/notifications';
import React from 'react';
import { CWCoverImageUploader } from 'views/components/component_kit/cw_cover_image_uploader';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextArea } from 'views/components/component_kit/cw_text_area';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

const InputsShowcase = () => {
  return (
    <>
      <CWText type="h5">Compact size</CWText>

      <div className="flex-column">
        <CWTextInput
          name="Text field"
          label="Text Input with default width"
          placeholder="Placeholder"
          isCompact
        />
        <CWTextInput
          name="Text field"
          label="Full width"
          placeholder="Placeholder"
          isCompact
          fullWidth
        />
        <CWTextInput
          name="Text field"
          label="Text Input with instructional message"
          placeholder="Placeholder"
          isCompact
          instructionalMessage="Instructional message"
        />

        <CWText fontWeight="medium">Validation</CWText>

        <CWTextInput
          name="Form field"
          inputValidationFn={(val: string): [ValidationStatus, string] => {
            if (val.match(/[^A-Za-z]/)) {
              return ['failure', 'Must enter characters A-Z'];
            } else {
              return ['success', 'Input validated'];
            }
          }}
          label="This input only accepts A-Z"
          placeholder="Type here"
          isCompact
        />

        <CWText fontWeight="medium">Icons</CWText>

        <CWTextInput
          label="Text field with left icon"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          isCompact
        />
        <CWTextInput
          label="Text field with right icon"
          name="Text field with icons"
          placeholder="Type here"
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          isCompact
        />
        <CWTextInput
          label="Text field with left and right icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
          isCompact
        />

        <CWTextInput
          name="Text field"
          label="Disabled"
          disabled
          value="Some disabled text"
          isCompact
        />
      </div>

      <CWText type="h5">Regular size</CWText>
      <div className="flex-column">
        <CWTextInput
          name="Text field"
          label="Text Input with default width"
          placeholder="Placeholder"
        />

        <CWTextInput
          name="Text field"
          label="Full width"
          placeholder="Placeholder"
          fullWidth
        />
        <CWTextInput
          name="Text field"
          label="Text Input with instructional message"
          placeholder="Placeholder"
          instructionalMessage="Instructional message"
        />

        <CWText fontWeight="medium">Validation</CWText>

        <CWTextInput
          name="Form field"
          inputValidationFn={(val: string): [ValidationStatus, string] => {
            if (val.match(/[^A-Za-z]/)) {
              return ['failure', 'Must enter characters A-Z'];
            } else {
              return ['success', 'Input validated'];
            }
          }}
          label="This input only accepts A-Z"
          placeholder="Type here"
        />

        <CWText fontWeight="medium">Icons</CWText>

        <CWTextInput
          label="Text field with left icon"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
        />
        <CWTextInput
          label="Text field with right icon"
          name="Text field with icons"
          placeholder="Type here"
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
        />
        <CWTextInput
          label="Text field with left and right icons"
          name="Text field with icons"
          placeholder="Type here"
          iconLeft={
            <MagnifyingGlass size={20} weight="regular" color="#A09DA1" />
          }
          iconRight={
            <ArrowCircleRight size={20} weight="regular" color="#338FFF" />
          }
        />

        <CWTextInput
          name="Text field"
          label="Disabled"
          disabled
          value="Some disabled text"
        />
      </div>

      <CWText type="h5">Text area</CWText>

      <CWTextArea name="Textarea" label="Text area" placeholder="Placeholder" />
      <CWTextArea
        name="Textarea"
        label="Text area disabled"
        placeholder="Placeholder"
        disabled
      />

      <CWText type="h5">Image upload</CWText>

      <CWCoverImageUploader
        uploadCompleteCallback={(url: string) => {
          notifySuccess(`Image uploaded to ${url.slice(0, 18)}...`);
        }}
        enableGenerativeAI
        canSelectImageBehaviour={false}
      />
    </>
  );
};

export default InputsShowcase;
