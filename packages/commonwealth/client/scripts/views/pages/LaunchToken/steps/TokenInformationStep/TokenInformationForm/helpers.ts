import { openConfirmation } from 'views/modals/confirmation_modal';

export const triggerTokenLaunchFormAbort = (onAbortConfirm: () => void) => {
  openConfirmation({
    title: 'Are you sure you want to cancel?',
    description: 'Your details will not be saved. Cancel create token flow?',
    buttons: [
      {
        label: 'Yes, cancel',
        buttonType: 'destructive',
        buttonHeight: 'sm',
        onClick: onAbortConfirm,
      },
      {
        label: 'No, continue',
        buttonType: 'primary',
        buttonHeight: 'sm',
      },
    ],
  });
};
