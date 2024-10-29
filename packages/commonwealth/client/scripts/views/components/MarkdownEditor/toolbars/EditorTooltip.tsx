import React from 'react';
import { useMarkdownEditorMode } from 'views/components/MarkdownEditor/useMarkdownEditorMode';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { TooltipProps } from 'views/components/component_kit/new_designs/CWTooltip/CWTooltip';

/**
 * Functions just like CWTooltip but only activates tooltip when the editor
 * is in desktop mode.  Otherwise, tooltips can popup on mobile and that is
 * confusing at times.
 */
export const EditorTooltip = (props: TooltipProps) => {
  const { renderTrigger } = props;
  const mode = useMarkdownEditorMode();

  return (
    <CWTooltip
      {...props}
      renderTrigger={(handleInteraction, isOpen) => {
        const handleInteractionDelegate = (e: React.MouseEvent<AnchorType>) => {
          if (mode === 'desktop') {
            handleInteraction(e);
          }
        };

        return renderTrigger(handleInteractionDelegate, isOpen);
      }}
    />
  );
};
