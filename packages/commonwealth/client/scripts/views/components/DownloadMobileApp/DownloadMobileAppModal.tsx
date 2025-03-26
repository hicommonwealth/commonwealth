import React from 'react';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';

// <CWModal
//   size="large"
//   content={
//     <ThreadPreviewModal
//       isThreadModalOpen={isThreadModalOpen}
//       onClose={() => setIsThreadModalOpen(false)}
//       images={extractImages(selectedThread?.body)}
//       thread={selectedThread}
//     />
//   }
//   onClose={closeModal}
//   open={isThreadModalOpen}
// />

export const DownloadMobileAppModal = () => {
  return (
    <CWModal
      size="large"
      content={<div>This is the modal</div>}
      onClose={() => {}}
      open={true}
    />
  );
};
