import { linkValidationSchema } from 'helpers/formValidations/common';
import { useState } from 'react';
import { ZodError } from 'zod';
import { SocialLinkField } from './types';

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
        // @ts-expect-error StrictNullChecks
        if (link.value.trim() !== '') {
          linkValidationSchema.required.parse(link.value);
        }

        updatedSocialLinks[index] = {
          ...updatedSocialLinks[index],
          error: '',
        };
      } catch (e) {
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
      // @ts-expect-error StrictNullChecks
      if (updatedSocialLinks[index].value.trim() !== '') {
        linkValidationSchema.required.parse(updatedSocialLinks[index].value);
      }

      updatedSocialLinks[index] = {
        ...updatedSocialLinks[index],
        error: '',
      };
    } catch (e) {
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
