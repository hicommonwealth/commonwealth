export interface ActionStepProps {
  state: 'not-started' | 'completed' | 'loading';
  label: string;
  index: number;
  actionButton?: {
    label: string;
    disabled: boolean;
    onClick: () => void;
  };
}
