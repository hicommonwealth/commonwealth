import { ThreadTimelineFilterTypes } from "models/types";
import moment from 'moment';

export const getToAndFromDatesRangesForThreadsTimelines = (timeline: ThreadTimelineFilterTypes) => {
    const today = moment();

    const fromDate = (() => {
        if (!timeline) return null
        if (timeline.toLowerCase() === ThreadTimelineFilterTypes.AllTime) {
            return new Date(0).toISOString();
        }
        if (
            [ThreadTimelineFilterTypes.ThisMonth, ThreadTimelineFilterTypes.ThisWeek].includes(timeline)
        ) {
            return today
                .startOf(timeline.toLowerCase().replace('this', '') as any)
                .toISOString();
        }
    })();

    const toDate = (() => {
        if (!timeline) return moment().toISOString();
        if (timeline.toLowerCase() === ThreadTimelineFilterTypes.AllTime) {
            return moment().toISOString();
        }
        if (
            [ThreadTimelineFilterTypes.ThisMonth, ThreadTimelineFilterTypes.ThisWeek].includes(timeline)
        ) {
            return today
                .endOf(timeline.toLowerCase().replace('this', '') as any)
                .toISOString();
        }
    })();

    return { toDate, fromDate }
}