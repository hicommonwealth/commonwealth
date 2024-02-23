import { useState } from 'react';
import { SocialLinkField } from 'views/pages/CreateCommunity/steps/BasicInformationStep/BasicInformationForm/types';
import { ZodError } from 'zod';
import { socialLinkValidation } from './validation';

const useSocialLinks = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLinkField[]>([
    {
      value: '',
      error: '',
    },
  ]);

  const addLink = () => {
    setSocialLinks((socialLink) => [
      ...(socialLink || []),
      { value: '', error: '' },
    ]);
  };

  const removeLinkAtIndex = (index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks.splice(index, 1);
    setSocialLinks([...updatedSocialLinks]);
  };

  const validateSocialLinks = (): boolean => {
    const updatedSocialLinks = [...socialLinks];
    socialLinks.map((link, index) => {
      try {
        if (link.value.trim() !== '') {
          socialLinkValidation.parse(link.value);
        }

        updatedSocialLinks[index] = {
          ...updatedSocialLinks[index],
          error: '',
        };
      } catch (e: any) {
        const zodError = e as ZodError;
        updatedSocialLinks[index] = {
          ...updatedSocialLinks[index],
          error: zodError.errors[0].message,
        };
      }
    });

    setSocialLinks([...updatedSocialLinks]);

    return !!updatedSocialLinks.find((socialLink) => socialLink.error);
  };

  const updateAndValidateSocialLinkAtIndex = (value: string, index: number) => {
    const updatedSocialLinks = [...socialLinks];
    updatedSocialLinks[index] = {
      ...updatedSocialLinks[index],
      value,
    };
    try {
      if (updatedSocialLinks[index].value.trim() !== '') {
        socialLinkValidation.parse(updatedSocialLinks[index].value);
      }

      updatedSocialLinks[index] = {
        ...updatedSocialLinks[index],
        error: '',
      };
    } catch (e: any) {
      const zodError = e as ZodError;
      updatedSocialLinks[index] = {
        ...updatedSocialLinks[index],
        error: zodError.errors[0].message,
      };
    }
    setSocialLinks([...updatedSocialLinks]);
  };

  return {
    socialLinks,
    addLink,
    removeLinkAtIndex,
    validateSocialLinks,
    updateAndValidateSocialLinkAtIndex,
  };
};

export default useSocialLinks;
