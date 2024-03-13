import { useMemo } from 'react';
import { Quill } from 'react-quill';

const Delta = Quill.import('delta');

export const useClipboardMatchers = () => {
  // must be memoized or else infinite loop
  const clipboardMatchers = useMemo(() => {
    return [
      [
        Node.ELEMENT_NODE,
        (node, delta) => {
          return delta.compose(
            new Delta().retain(delta.length(), {
              header: false,
              align: false,
              color: false,
              background: false,
            }),
          );
        },
      ],
    ];
  }, []);

  return { clipboardMatchers };
};
