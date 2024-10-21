import {
  cancelLinkEdit$,
  linkDialogState$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { createPortal } from 'react-dom';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/CustomLinkPreview';

export const CustomLinkDialog = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const cancelLinkEdit = usePublisher(cancelLinkEdit$);
  // switchFromPreviewToLinkEdit$

  // {
  //   "type": "edit",
  //   "initialUrl": "",
  //   "initialTitle": "",
  //   "title": "",
  //   "url": "",
  //   "linkNodeKey": "",
  //   "rectangle": {
  //   "top": 207,
  //     "left": 399,
  //     "width": 49,
  //     "height": 19
  //
  // {
  //   "type": "preview",
  //   "url": "https://www.youtube.com/watch?v=eRBOgtp0Hac",
  //   "linkNodeKey": "199",
  //   "title": null,
  //   "rectangle": {
  //   "top": 668,
  //     "left": 28,
  //     "width": 0,
  //     "height": 19
  // }
  // }

  console.log('FIXME: ', JSON.stringify(linkDialogState, null, 2));

  // TODO: implement both modes...
  // TODO: implement the ability to change modes.
  // TODO: figure out how to remove the formatting...

  if (linkDialogState.type === 'inactive') {
    return <></>;
  }

  return createPortal(
    <>
      return (
      <div
        style={{
          position: 'absolute',
          top: linkDialogState.rectangle.top - linkDialogState.rectangle.height,
          left: linkDialogState.rectangle.left,
          backgroundColor: 'red',
        }}
      >
        {linkDialogState.type === 'preview' && <CustomLinkPreview />}
      </div>
      );
    </>,
    document.body,
  );
};
