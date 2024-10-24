import clsx from 'clsx';
import React from 'react';
import { useMarkdownEditorMode } from 'views/components/MarkdownEditor/useMarkdownEditorMode';
import './MarkdownSubmitButton.scss';

export type MarkdownSubmitButtonProps = Readonly<{
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  tabIndex?: number;
}>;

/**
 * Button that adapts itself to mobile vs desktop.
 *
 * On mobile devices we don't use the label to save space.
 */
export const MarkdownSubmitButton = (props: MarkdownSubmitButtonProps) => {
  const { onClick, className, disabled, label, tabIndex } = props;

  const mode = useMarkdownEditorMode();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      tabIndex={tabIndex}
      className={clsx('MarkdownSubmitButton', className)}
    >
      {mode === 'desktop' ? label : '➤'}
    </button>
  );
};
