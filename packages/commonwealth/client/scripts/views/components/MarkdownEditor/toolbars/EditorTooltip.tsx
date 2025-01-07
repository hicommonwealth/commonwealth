import React from 'react';
import { useMarkdownEditorMode } from 'views/components/MarkdownEditor/useMarkdownEditorMode';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { TooltipProps } from 'views/components/component_kit/new_designs/CWTooltip/CWTooltip';

function nullRenderTrigger() {
  // noop render trigger that does nothing on mobile.
}

/**
 * Functions just like CWTooltip but only activates tooltip when the editor
 * is in desktop mode.  Otherwise, tooltips can popup on mobile and that is
 * confusing at times.
 */
export const EditorTooltip = (props: TooltipProps) => {
  const { renderTrigger } = props;
  const mode = useMarkdownEditorMode();

  if (mode === 'mobile') {
    // don't use the CWTooltip on mobile to avoid issues with rendering on
    // Safari mobile
    return renderTrigger(nullRenderTrigger);
  }

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
