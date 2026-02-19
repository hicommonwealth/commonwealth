import React, { ReactNode } from 'react';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';

type MarkdownViewerWithFallbackProps = {
  readonly markdown: string | undefined;
  readonly cutoffLines?: number;
  readonly customShowMoreButton?: ReactNode;
  readonly className?: string;
  readonly maxChars?: number;
  onImageClick?: () => void;
};

/**
 * Rendering wrapper that keeps the Quill viewer as the single path.
 */
export const MarkdownViewerWithFallback = (
  props: MarkdownViewerWithFallbackProps,
) => {
  const {
    markdown,
    cutoffLines,
    customShowMoreButton,
    className,
    maxChars,
    onImageClick,
  } = props;

  return (
    <QuillRenderer
      customClass={className}
      doc={markdown ?? ''}
      maxChars={maxChars}
      customShowMoreButton={customShowMoreButton}
      onImageClick={onImageClick}
      cutoffLines={cutoffLines}
    />
  );
};
