import { useFlag } from 'hooks/useFlag';
import React, { ReactNode } from 'react';
import MarkdownViewer from 'views/components/MarkdownViewer';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';

type MarkdownViewerWithFallbackProps = {
  readonly markdown: string | undefined;
  readonly cutoffLines?: number;
  readonly customShowMoreButton?: ReactNode;
  readonly className?: string;
  onImageClick?: () => void;
  threadImage?: string | null;
  isCardView?: boolean;
};

/**
 * Temporary migration component that uses a feature toggle for viewing content.
 */
export const MarkdownViewerWithFallback = (
  props: MarkdownViewerWithFallbackProps,
) => {
  const {
    markdown,
    cutoffLines,
    customShowMoreButton,
    className,
    onImageClick,
    threadImage,
    isCardView,
  } = props;

  const newEditor = useFlag('newEditor');

  if (newEditor) {
    return (
      <MarkdownViewer
        markdown={markdown}
        cutoffLines={cutoffLines}
        customShowMoreButton={customShowMoreButton}
        className={className}
      />
    );
  }

  return (
    <QuillRenderer
      customClass={className}
      doc={markdown ?? ''}
      cutoffLines={cutoffLines}
      customShowMoreButton={customShowMoreButton}
      onImageClick={onImageClick}
      threadImage={threadImage}
      isCardView={isCardView}
    />
  );
};
