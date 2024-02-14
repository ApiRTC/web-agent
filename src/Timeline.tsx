import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { useThemeProps } from "@mui/material/styles";

import { TimelineEvent } from "./types";

export type TimelineProps = {
    events: Array<TimelineEvent>,
    noEventsText?: string,
};

const COMPONENT_NAME = "Timeline";
export function Timeline(inProps: TimelineProps) {
    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const {
        events,
        noEventsText = 'no events yet',
    } = props;

    const renderTimelineEvent = (event: TimelineEvent) => {
        const dateTimeString = event.dateTime.toLocaleString();
        const name = event.name;
        if (event.dataUrl) {
            const filename = `${event.dateTime.getUTCFullYear()}${event.dateTime.getUTCMonth()}${event.dateTime.getDate()}_${event.dateTime.toLocaleTimeString()}_${name}_${event.message}.png`.replaceAll(':', '-');
            return <>{dateTimeString}&nbsp;:&nbsp;
                <Link href={event.dataUrl} underline='none' download={filename}>
                    {event.message}</Link>&nbsp;from&nbsp;{name}</>
        } else {
            return `${dateTimeString} : ${name} ${event.message}`
        }
    };

    return <Stack direction="column"
        justifyContent="center" alignItems="center"
        spacing={1}>
        {events.length === 0 ?
            <Alert key={0} variant='outlined' severity='info'>{noEventsText}</Alert> :
            events.map((event: TimelineEvent, index: number) =>
                <Alert key={index} variant='outlined' severity={event.severity}>{renderTimelineEvent(event)}</Alert>)
        }
    </Stack>
}