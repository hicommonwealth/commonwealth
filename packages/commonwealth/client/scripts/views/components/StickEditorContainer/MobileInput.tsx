import React, { useCallback, useMemo, useState } from 'react';
import useUserStore from 'state/ui/user';
import { Avatar } from 'views/components/Avatar';
import { CommentEditorProps } from 'views/components/Comments/CommentEditor/CommentEditor';
import { useActiveStickCommentReset } from 'views/components/StickEditorContainer/CommentStateContext';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { createDeltaFromText } from 'views/components/react_quill_editor';
import './MobileInput.scss';

type MobileInputProps = CommentEditorProps & {
  onFocus?: () => void;
};

export const MobileInput = (props: MobileInputProps) => {
  const {
    onFocus,
    setContentDelta,
    handleSubmitComment,
    isReplying,
    replyingToAuthor,
  } = props;
  const [value, setValue] = useState('');
  const user = useUserStore();

  const handleClose = useActiveStickCommentReset();

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

  const avatarURL = useMemo(() => {
    const filtered = user.accounts.filter(
      (current) => current.profile?.avatarUrl,
    );
    if (filtered.length > 0) {
      return filtered[0].profile?.avatarUrl;
    }

    return undefined;
  }, [user]);

  const placeholder = isReplying
    ? `Replying to ${replyingToAuthor} ...`
    : `Comment on thread here...`;

  return (
    <div className="MobileInput">
      {avatarURL && (
        <div className="AvatarBox">
          <Avatar url={avatarURL} size={32} />
        </div>
      )}

      <div className="InputBox">
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          value={value}
        />

        <div className="RightButton">
          {isReplying && (
            <CWIconButton iconName="close" onClick={handleClose} />
          )}
          <CWIconButton iconName="arrowsOutSimple" onClick={onFocus} />
        </div>
      </div>
    </div>
  );
};
