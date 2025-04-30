import { notifyError } from 'controllers/app/notifications';
import React, { useCallback, useRef, useState } from 'react';
import { useUploadFileMutation } from 'state/api/general';
import { CWImageInput } from '../component_kit/CWImageInput';
import { ImageProcessingProps } from '../component_kit/CWImageInput/types';
import { CWText } from '../component_kit/cw_text';
import { CWButton } from '../component_kit/new_designs/CWButton';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../component_kit/new_designs/CWModal';
import { CWResponsiveDialog } from '../component_kit/new_designs/CWResponsiveDialog';
import './ImageActionModal.scss';
import { ReferenceImageItem } from './ReferenceImageItem';

const MAX_REFERENCE_IMAGES = 4;

interface ImageActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (imageUrl: string) => void;
  applyButtonLabel?: string;
}

export const ImageActionModal = ({
  isOpen,
  onClose,
  onApply,
  applyButtonLabel = 'Add to Thread',
}: ImageActionModalProps) => {
  const [imageUrlToApply, setImageUrlToApply] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);

  // File input ref for reference image uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload mutation for reference images
  const { mutateAsync: uploadReferenceImage } = useUploadFileMutation({
    onSuccess: (uploadUrl) => {
      console.log('Reference image uploaded:', uploadUrl);
      if (referenceImageUrls.length < MAX_REFERENCE_IMAGES) {
        setReferenceImageUrls((prevUrls) => [...prevUrls, uploadUrl]);
      }
    },
  });

  // --- Reference Image Handlers ---
  const handleAddReferenceFromInput = useCallback(() => {
    if (
      imageUrlToApply &&
      referenceImageUrls.length < MAX_REFERENCE_IMAGES &&
      !referenceImageUrls.includes(imageUrlToApply)
    ) {
      console.log('Adding reference from input:', imageUrlToApply);
      setReferenceImageUrls((prevUrls) => [...prevUrls, imageUrlToApply]);
    }
  }, [imageUrlToApply, referenceImageUrls]);

  const handleRemoveReference = useCallback((urlToRemove: string) => {
    console.log('Removing reference:', urlToRemove);
    setReferenceImageUrls((prevUrls) =>
      prevUrls.filter((url) => url !== urlToRemove),
    );
  }, []);

  // Handle click on empty reference item
  const handleReferenceUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Upload the selected file
        uploadReferenceImage({ file }).catch((err) => {
          console.error('Failed to upload reference image:', err);
          notifyError('Failed to upload reference image');
        });
      }

      // Reset the input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [uploadReferenceImage],
  );

  // --- Internal Handlers for CWImageInput Callbacks ---
  const handleImageUploaded = useCallback((url: string) => {
    console.log('Main image uploaded:', url);
    setImageUrlToApply(url);
    setIsProcessing(false);
  }, []);

  const handleImageGenerated = useCallback((url: string) => {
    console.log('Main image generated:', url);
    setImageUrlToApply(url);
    setIsProcessing(false);
  }, []);

  const handleImageProcessingChange = useCallback(
    (processStatus: ImageProcessingProps) => {
      setIsProcessing(processStatus.isGenerating || processStatus.isUploading);
    },
    [],
  );

  // --- Apply Handler ---
  const handleApply = () => {
    if (imageUrlToApply) {
      onApply(imageUrlToApply);
      onClose();
    } else {
      notifyError('No image available to apply.');
    }
  };

  // --- Derived State ---
  const canAddMoreReferences = referenceImageUrls.length < MAX_REFERENCE_IMAGES;
  const canAddCurrentToReference =
    !!imageUrlToApply &&
    canAddMoreReferences &&
    !referenceImageUrls.includes(imageUrlToApply);

  return (
    <CWResponsiveDialog open={isOpen} onClose={onClose}>
      <CWModalHeader label="Generate Image" onModalClose={onClose} />
      <CWModalBody>
        {/* --- Remix Image Row --- */}
        <div className="reference-images-container">
          <span className="reference-label">Remix Images:</span>
          <CWText
            type="caption"
            fontWeight="regular"
            className="reference-subheading"
          >
            Add images to direct image generation.
          </CWText>

          {/* Reference image grid */}
          <div className="reference-grid">
            {/* Existing reference images */}
            {referenceImageUrls.map((url, index) => (
              <div key={`ref-${index}`} className="grid-item">
                <ReferenceImageItem
                  imageUrl={url}
                  onRemove={() => handleRemoveReference(url)}
                />
              </div>
            ))}

            {/* Empty uploader slot */}
            {canAddMoreReferences && (
              <div className="grid-item">
                <ReferenceImageItem
                  onUploadClick={handleReferenceUploadClick}
                />
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* --- Image Input Area --- */}
        <div className="image-input-container">
          <CWImageInput
            name="image-action-modal-input"
            hookToForm={false}
            withAIImageGeneration={true}
            onImageUploaded={handleImageUploaded}
            onImageGenerated={handleImageGenerated}
            onImageProcessingChange={handleImageProcessingChange}
            loading={isProcessing}
            canSwitchBetweenProcessedImages={true}
            usePersistentPromptMode={true}
            onAddCurrentToReference={handleAddReferenceFromInput}
            canAddCurrentToReference={canAddCurrentToReference}
            referenceImageUrls={referenceImageUrls}
          />
        </div>
      </CWModalBody>
      <CWModalFooter className="ImageActionModalFooter">
        <CWButton
          label={applyButtonLabel}
          onClick={handleApply}
          disabled={!imageUrlToApply || isProcessing}
        />
      </CWModalFooter>
    </CWResponsiveDialog>
  );
};
