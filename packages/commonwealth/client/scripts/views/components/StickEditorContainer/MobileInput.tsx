import React, { useCallback, useState } from 'react';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import './MobileInput.scss';

type MobileInputProps = CommentEditorProps & {
  onFocus?: () => void;
};

export const MobileInput = (props: MobileInputProps) => {
  const { onFocus, setContentDelta, handleSubmitComment } = props;
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      setContentDelta(createDeltaFromText(event.target.value));
    },
    [setContentDelta],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setValue('');
        handleSubmitComment();
      }
    },
    [handleSubmitComment],
  );

  return (
    <div className="MobileInput">
      <div className="InputBox">
        <input
          type="text"
          placeholder="Comment on thread here..."
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={value}
        />

        <div className="RightButton">
          <CWIconButton iconName="arrowsOutSimple" onClick={onFocus} />
        </div>
      </div>
    </div>
  );
};
