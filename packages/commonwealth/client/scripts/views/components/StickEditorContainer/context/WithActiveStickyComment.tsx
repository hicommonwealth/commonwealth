import { useFlag } from 'hooks/useFlag';
import { memo, ReactNode, useEffect } from 'react';
import { useActivatorContext } from 'views/components/StickEditorContainer/context/UseActivatorContext';

type Props = {
  children: ReactNode;
};

/**
 * We need to wrap our comment reply in this so that when the user hits reply
 * it overrides the main comment post.
 */
export const WithActiveStickyComment = memo(function WithActiveStickyComment(
  props: Props,
) {
  const { children } = props;

  const stickyEditor = useFlag('stickyEditor');

  const activator = useActivatorContext();

  useEffect(() => {
    if (!stickyEditor) {
      return;
    }

    activator.setActiveElement(children);

    return () => {
      activator.setActiveElement(null);
    };
  }, [children, activator, stickyEditor]);

  return stickyEditor ? null : props.children;
});
