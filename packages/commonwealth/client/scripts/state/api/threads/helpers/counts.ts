import { ThreadStage } from 'models/types';
import { EXCEPTION_CASE_threadCountersStore } from '../../../ui/thread';

export const updateThreadCountsByStageChange = (currentStage, updatedStage) => {
    let incBy = 0;
    if (currentStage === ThreadStage.Voting) incBy--;
    if (updatedStage === ThreadStage.Voting) incBy++;
    EXCEPTION_CASE_threadCountersStore.setState(
        ({ totalThreadsInCommunityForVoting }) => ({
            totalThreadsInCommunityForVoting:
                totalThreadsInCommunityForVoting + incBy,
        })
    );
}