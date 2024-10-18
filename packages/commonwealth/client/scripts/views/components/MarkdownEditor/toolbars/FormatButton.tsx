import clsx from 'clsx';
import {
  applyFormat$,
  currentFormat$,
  FORMAT,
  iconComponentFor$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import { TextFormatType } from 'lexical';
import React, { useCallback } from 'react';
import CWIconButton from 'views/components/component_kit/new_designs/CWIconButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { formatToIconName } from 'views/components/MarkdownEditor/toolbars/formatToIconName';
import './CWHeadingButton.scss';

export type HeadingButtonProps = Readonly<{
  format: FORMAT;
  formatName: TextFormatType;

  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}>;

export const FormatButton = (props: HeadingButtonProps) => {
  const { format, onClick, formatName } = props;

  const applyFormat = usePublisher(applyFormat$);
  const [currentFormat] = useCellValues(currentFormat$, iconComponentFor$);

  const active = (currentFormat & format) !== 0;

  const toggleFormat = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      applyFormat(formatName);

      onClick?.(event);
    },
    [applyFormat, formatName, onClick],
  );

  return (
    <CWTooltip
      content={`Change to ${formatName}`}
      renderTrigger={(handleInteraction) => (
        <CWIconButton
          className={clsx({ CWHeadingButtonActive: active })}
          buttonSize="lg"
          iconName={formatToIconName(format)}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
          onClick={toggleFormat}
        />
      )}
    />
  );
};
