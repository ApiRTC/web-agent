import React, { useCallback, useContext, useEffect, useMemo } from "react";

import { Stream as ApiRTCStream, Contact, Conversation } from "@apirtc/apirtc";
import {
    Grid as ApiRtcGrid,
    Audio as AudioComponent,
    AudioEnableButton,
    MuteButton,
    SnapshotButton,
    Stream,
    Video, VideoEnableButton
} from "@apirtc/mui-react-lib";
import { useConversationStreams } from "@apirtc/react-lib";

import CallEndIcon from '@mui/icons-material/CallEnd';
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { ThemeProvider as MuiThemeProvider, SxProps, useThemeProps } from '@mui/material/styles';
import Tooltip from "@mui/material/Tooltip";
import Grid from '@mui/material/Unstable_Grid2';

import { AppContext } from './AppContext';
import { ROOM_THEME, VIDEO_ROUNDED_CORNERS } from './constants';
import { OutputMessageType } from "./MessageTypes";
import { SwitchFacingModeButton } from "./SwitchFacingModeButton";

const VIDEO_SIZING = { height: '100%', maxWidth: '100%' };

export type RoomProps = {
    sx?: SxProps,
    conversation: Conversation,
    stream?: ApiRTCStream,
    onSnapshot?: (contact: Contact, dataUrl: string) => Promise<void>,
    onDisplayChange?: () => void,
    hangUpText?: string
};

const COMPONENT_NAME = "Room";
export function Room(inProps: RoomProps) {

    const { notify } = useContext(AppContext);

    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const { conversation, stream,
        onDisplayChange,
        hangUpText = "HangUp"
    } = props;

    const streamsToPublish = useMemo(() => [...(stream ? [{ stream: stream }] : [])],
        [stream]);

    const { publishedStreams, subscribedStreams, unsubscribeAll } = useConversationStreams(
        conversation, streamsToPublish
    );

    if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${COMPONENT_NAME}|render|${conversation.getName()}`, stream, publishedStreams, subscribedStreams)
    }

    const subscribedStreamsLength = useMemo(() => subscribedStreams.length, [subscribedStreams]);

    useEffect(() => {
        notify({
            type: OutputMessageType.SubscribedStreams,
            length: subscribedStreamsLength,
        })
    }, [notify, subscribedStreamsLength])

    useEffect(() => {
        // This is to externally trigger resize when display changes
        if (onDisplayChange) {
            onDisplayChange()
        }
    }, [onDisplayChange, publishedStreams, subscribedStreams])

    const hangUp = useCallback((event: React.SyntheticEvent) => {
        event.preventDefault()

        if (globalThis.logLevel.isInfoEnabled) {
            console.info(`${COMPONENT_NAME}|hangUp`)
        }

        const msg = { hangUp: true };
        conversation.sendData(msg).then(() => {
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|hangUp sent`, msg)
            }
        }).catch((error: any) => {
            if (globalThis.logLevel.isWarnEnabled) {
                console.warn(`${COMPONENT_NAME}|hangUp send failure`, error)
            }
        }).finally(() => {
            // Unsubscribe to all streams is logical as we want to hang up.
            // But it also prevents from a problem when guest app and apirtc do not clean properly
            // the published streams : it results in agent app to wait for calls termination from Janus/CCS sig.
            //
            unsubscribeAll()
        })
    }, [conversation, unsubscribeAll]);

    return <Grid sx={{ ...props.sx }} container>
        <Grid xs={8} md={9} lg={10}>
            <MuiThemeProvider theme={ROOM_THEME}>
                <ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
                    {subscribedStreams.map((stream, index) =>
                        <Stream id={`subscribed-stream-${index}`} key={index}
                            sx={{
                                ...(stream.hasVideo() ? VIDEO_SIZING : { backgroundColor: 'grey' })
                            }}
                            stream={stream} detectSpeaking={true}
                            controls={<>
                                {stream.hasVideo() && !stream.isScreensharing() && <>
                                    <SwitchFacingModeButton />
                                </>}
                                {stream.hasVideo() && <SnapshotButton onSnapshot={(dataUrl: string) => {
                                    if (props.onSnapshot) {
                                        return props.onSnapshot(stream.getContact(), dataUrl)
                                    } else {
                                        return new Promise((resolve) => {
                                            resolve();
                                        })
                                    }
                                }} />}
                                {stream.hasAudio() && <MuteButton />}
                                {!stream.isScreensharing() && <AudioEnableButton />}
                                {stream.hasVideo() && !stream.isScreensharing() && <VideoEnableButton />}
                            </>}
                            muted={false}
                            name={`${stream.getContact().getUserData().get('firstName')}${stream.isScreensharing() ? '-screen' : ''}`}
                        >
                            {stream.hasVideo() ? <Video
                                sx={{ ...VIDEO_SIZING }}
                                style={{
                                    ...VIDEO_SIZING,
                                    ...VIDEO_ROUNDED_CORNERS,
                                    objectFit: 'cover'
                                }} /> : <AudioComponent />}
                        </Stream>)}
                </ApiRtcGrid>
            </MuiThemeProvider>
        </Grid>
        <Grid xs={4} md={3} lg={2}>
            <Stack direction="column" spacing={1} >
                <MuiThemeProvider theme={ROOM_THEME}>
                    <ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
                        {publishedStreams.map((stream, index) =>
                            <Stream id={`published-stream-${index}-${stream.getId()}`} key={index}
                                data-testid={stream.getId()}
                                sx={{
                                    ...(stream.hasVideo() ? VIDEO_SIZING : { backgroundColor: 'grey' })
                                }}
                                stream={stream} muted={true}
                                controls={<>
                                    {!stream.isScreensharing() && <AudioEnableButton />}
                                    {stream.hasVideo() && !stream.isScreensharing() && <VideoEnableButton />}
                                </>}>
                                {stream.hasVideo() ?
                                    <Video
                                        sx={VIDEO_SIZING}
                                        style={{
                                            ...VIDEO_SIZING, width: '100%',
                                            ...VIDEO_ROUNDED_CORNERS,
                                            objectFit: 'cover'
                                        }} /> :
                                    <AudioComponent />}
                            </Stream>
                        )}
                    </ApiRtcGrid>
                </MuiThemeProvider>
                {
                    subscribedStreams.length > 0 &&
                    <Stack direction='column' alignItems='center' justifyContent='center'>
                        <ButtonGroup variant="outlined" size="small" aria-label="call-bar">
                            <Tooltip title={hangUpText}>
                                <IconButton color='error'
                                    onClick={hangUp}><CallEndIcon /></IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </Stack>
                }
            </Stack>
        </Grid>
    </Grid>
}