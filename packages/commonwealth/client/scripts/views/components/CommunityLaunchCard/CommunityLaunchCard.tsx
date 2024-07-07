import React, { useState, useCallback } from 'react';
import { CWCard } from '../component_kit/cw_card';
import { CWTextInput } from '../component_kit/cw_text_input';
import { CWButton } from '../component_kit/new_designs/CWButton';
import { CWText } from '../component_kit/cw_text';
import './CommunityLaunchCard.scss';
import useQuickCreateCommunity from 'hooks/useQuickCreateCommunity';
import { CWCoverImageUploader, ImageBehavior } from '../component_kit/cw_cover_image_uploader';
import CWIconButton from '../component_kit/new_designs/CWIconButton';
import OpenAI from 'openai';
import axios from 'axios';
import app from 'client/scripts/state';
import { ChainBase } from '@hicommonwealth/shared';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';

interface CommunityLaunchCardProps {
  onLaunch: (name: string, image?: File) => void;
}

export const CommunityLaunchCard: React.FC<CommunityLaunchCardProps> = ({ onLaunch }) => {
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [defaultImageUrl, setDefaultImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);

  const { createCommunity, isLoading, error } = useQuickCreateCommunity();

  const generateMissingFields = async () => {
    let generatedName = name;
    let generatedDescription = description;
    let generatedImageUrl = defaultImageUrl;

    // Generate name if it's empty
    if (!name) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
      const nameCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: "Generate a short, catchy name for a new community. Keep it concise and memorable."
          }
        ],
      });

      generatedName = nameCompletion.choices[0].message.content?.trim() || 'New Community';
      setName(generatedName);
    }

    // Generate description if it's empty
    if (!description) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: "Generate a short, compelling description for a community called '" + name + "'. Keep it concise and engaging."
          }
        ],
      });

      generatedDescription = completion.choices[0].message.content || '';
      setDescription(generatedDescription);
    }

    // Generate image if it's not set
    if (!defaultImageUrl) {
      const res = await axios.post(`${app.serverUrl()}/generateImage`, {
        description: `A logo for a community called "${name}"`,
        jwt: app.user.jwt,
      });
      generatedImageUrl = res.data.result.imageUrl;
      setDefaultImageUrl(generatedImageUrl);
    }

    return {
      name: generatedName,
      description: generatedDescription,
      icon_url: generatedImageUrl,
      // Add other required fields here
    };
  };

  const navigate = useCommonNavigate();

  const handleLaunch = useCallback(async () => {
    const ethereumAddress = app.user.addresses.find(addr => 
      addr.community.base === ChainBase.Ethereum
    );

    if (!ethereumAddress) {
      throw new Error('No Ethereum address found for this user');
    }
    
    try {
      const generatedFields = await generateMissingFields();
      const communityData = {
        name: generatedFields.name,
        description: generatedFields.description,
        icon_url: generatedFields.icon_url || '',
        address: ethereumAddress.address
      };
      await createCommunity(communityData);
      onLaunch(communityData.name, image || undefined);
      navigateToCommunity({ navigate, path: '', chain: communityData.name.toLowerCase() });
    } catch (err) {
      console.error('Failed to create community:', err);
    }
  }, [generateMissingFields, createCommunity, onLaunch, image]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  }, []);

  const handleImageUpload = useCallback((uploadedImage: File, imageUrl: string) => {
    setImage(uploadedImage);
    setDefaultImageUrl(imageUrl);
  }, []);

  const handleGeneratedImage = useCallback((generatedImage: File) => {
    setImage(generatedImage);
    setImageKey(prevKey => prevKey + 1); // Increment the key to force re-render
  }, []);

  const handleGeneration = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Initialize OpenAI
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
  
      // Generate community idea
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: "a compelling, funny, catchy community that people will buy. It should be a short tweet length, to the point, lowercase only. Don't include filler, just show the idea"
          }
        ],
      });
  
      const communityIdea = completion.choices[0].message.content;
  
      // Set the community name and show image uploader
      setDescription(communityIdea || '');
  
      // Generate image for the community
      const res = await axios.post(`${app.serverUrl()}/generateImage`, {
        description: `A logo for a community called "${communityIdea}"`,
        jwt: app.user.jwt,
      });
      const generatedImageURL = res.data.result.imageUrl;

      // Log the generated image URL
      console.log('Generated Image URL:', generatedImageURL);

      // Set the defaultImageUrl state
      setDefaultImageUrl(generatedImageURL);

      // Set the generated image in the CWCoverImageUploader
      if (generatedImageURL) {
        const response = await fetch(generatedImageURL);
        const blob = await response.blob();
        const file = new File([blob], 'community-image.png', { type: 'image/png' });
        handleGeneratedImage(file);
        setShowImageUploader(true);
      }
    } catch (error) {
      console.error('Error generating community:', error);
    }
  }, [setDescription, handleGeneratedImage, setShowImageUploader]);

  const toggleImageUploader = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setShowImageUploader((prev) => !prev);
  }, []);

  return (
    <CWCard className="launch-card" fullWidth={true}>
      <CWText type="h4">Launch a coin</CWText>
      <CWTextInput
        value={description}
        onInput={handleNameChange}
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
            defaultImageUrl={defaultImageUrl || undefined}
            defaultImageBehaviour={ImageBehavior.Fill}
            canSelectImageBehaviour={false}
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
            disabled={!description || isLoading}
            buttonHeight="med"
            buttonWidth="narrow"
          >
            {isLoading ? 'Loading...' : 'Launch'}
          </CWButton>
        </div>
      </div>
      {error && <CWText color="negative">{error}</CWText>}
    </CWCard>
  );
};