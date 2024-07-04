import React, { useState, useCallback } from 'react';
import { CWCard } from '../component_kit/cw_card';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWText } from '../component_kit/cw_text';
import { CWCoverImageUploader } from '../component_kit/cw_cover_image_uploader';
import { CWIconButton } from '../component_kit/cw_icon_button';
import './CommunityLaunchCard.scss';

interface CommunityLaunchCardProps {
  onLaunch: (name: string, image?: File) => void;
}

export const CommunityLaunchCard: React.FC<CommunityLaunchCardProps> = ({ onLaunch }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);

  const handleLaunch = useCallback(() => {
    if (name) {
      onLaunch(name, image || undefined);
    }
  }, [name, image, onLaunch]);

  const toggleImageUploader = useCallback(() => {
    setShowImageUploader(!showImageUploader);
  }, [showImageUploader]);

  const handleGeneration = useCallback(() => {
    // Simulate idea and image generation
    const generatedName = 'Generated Idea Name';
    const generatedImage = new File([''], 'generatedImage.png', { type: 'image/png' });

    setName(generatedName);
    setImage(generatedImage);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleImageUpload = useCallback((uploadedImage: File) => {
    setImage(uploadedImage);
  }, []);

  const handleGeneratedImage = useCallback((generatedImage: File) => {
    setImage(generatedImage);
  }, []);

  return (
    <CWCard className="launch-card" fullWidth={true}>
      <CWText type="h4">Launch a coin</CWText>
      <CWTextInput
        value={name}
        onChange={handleNameChange}
        placeholder="Your idea to coin..."
      />
      {showImageUploader && (
        <div className="image-uploader-container">
          <CWText>Image (optional)</CWText>
          <CWCoverImageUploader
            enableGenerativeAI={true}
            generatedImageCallback={handleGeneratedImage}
            uploadCompleteCallback={handleImageUpload}
            onImageProcessStatusChange={() => {}}
          />
        </div>
      )}
      <div className="bottom-row">
        <div className="left-icon">
          <CWIconButton
            iconName="imageUpload"
            onClick={toggleImageUploader}
            className="image-toggle-button"
          />
        </div>
        <div className="right-buttons">
          <CWButton
            label="Random"
            onClick={handleGeneration}
            buttonHeight="med"
            buttonWidth="narrow"
            iconLeft="sparkle"
          />
          <CWButton
            label="Launch"
            onClick={handleLaunch}
            disabled={!name}
            buttonHeight="med"
            buttonWidth="narrow"
          />
        </div>
      </div>
    </CWCard>
  );
};