import { trpc } from 'utils/trpcClient';

const useTriggerNotificationsWorkflowMutation = () => {
  return trpc.superAdmin.triggerNotificationsWorkflow.useMutation({});
};

export default useTriggerNotificationsWorkflowMutation;
