import { memo, ReactNode, useEffect } from 'react';
import { useActivatorContext } from 'views/components/StickEditorContainer/context/UseActivatorContext';

type Props = {
  children: ReactNode;
};

/**
 * The default sticky comment.  This needs to wrap the main comment reply.
 */
export const WithDefaultStickyComment = memo(function WithDefaultStickyComment(
  props: Props,
) {
  const { children } = props;

  const activator = useActivatorContext();

  useEffect(() => {
    activator.setDefaultElement(children);

    return () => {
      activator.setDefaultElement(null);
    };
  }, [children, activator]);

  return null;
});
