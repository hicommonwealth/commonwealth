export interface ActionStepProps {
  state: 'not-started' | 'completed' | 'loading';
  label: string;
  description?: string;
  index: number;
  actionButton?: {
    label: string;
    disabled: boolean;
    onClick: () => void;
  };
}

export interface ActionStepsProps {
  steps: Array<Omit<ActionStepProps, 'index'> & { errorText?: string }>;
}
