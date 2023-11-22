// import React from "react";
import { createContext } from "react";
import { TimelineEvent } from "./types";

export const TimelineContext = createContext<{
    // timelineEvents: Array<TimelineEvent>;
    // setTimelineEvents: React.Dispatch<React.SetStateAction<Array<TimelineEvent>>>;
    addTimelineEvent: (event: TimelineEvent) => void;
}>({ addTimelineEvent: () => { } });

// export const useTimelineContext = () => {
//     const context = React.useContext(TimelineContext);
//     if (context === undefined) {
//         throw new Error('useTimelineContext must be inside a TimelineContext.provider');
//     }
//     return context;
// };