import clsx from 'clsx';
import React from 'react';
import { useDeviceProfile } from 'views/components/MarkdownEditor/useDeviceProfile';

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

  const deviceProfile = useDeviceProfile();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      tabIndex={tabIndex}
      className={clsx('MarkdownSubmitButton', className)}
    >
      {deviceProfile === 'desktop' ? label : '➤'}
    </button>
  );
};
