/* eslint-disable max-len */
import { QuillEditor } from '../../components/quill/quill_editor';
import { DescriptionSlide } from './create_project_form/description_slide';
import { FundraisingSlide } from './create_project_form/fundraising_slide';
import { InformationSlide } from './create_project_form/information_slide';

// Project display and rendering
export enum ProjectRole {
  Curator = 'curator',
  Backer = 'backer',
  Author = 'author',
}

export enum ProjectStatus {
  Failed = 'failed',
  Succeeded = 'succeeded',
  Active = 'active',
}

export enum ProjectCardSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// Create Project Form
export interface ICreateProjectForm {
  // Descriptive
  title: string;
  description: QuillEditor;
  shortDescription: string;
  coverImage: string;
  chainId: string;

  // Mechanical
  token: string;
  creator: string;
  beneficiary: string;
  threshold: number;
  fundraiseLength: number;
  curatorFee: number;
}

export type CreateProjectKey = keyof ICreateProjectForm;

export const CreateProjectSlides = {
  1: InformationSlide,
  2: FundraisingSlide,
  3: DescriptionSlide,
};

export type CreateProjectSlideNumber = keyof typeof CreateProjectSlides;

export type TokenOption = {
  name: string;
  address: string;
};

export const weekInSeconds = 604800;
export const nowInSeconds = new Date().getTime() / 1000;
export const WethUrl =
  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png';
