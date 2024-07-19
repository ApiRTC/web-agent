import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Stream as ApiRTCStream, Contact, Conversation } from "@apirtc/apirtc";
import {
    Grid as ApiRtcGrid,
    Audio as AudioComponent,
    AudioEnableButton,
    MuteButton,
    SnapshotButton,
    Stream, TorchButton, Video, VideoEnableButton
} from "@apirtc/mui-react-lib";
import { useConversationStreams } from "@apirtc/react-lib";

import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { ThemeProvider as MuiThemeProvider, SxProps, useThemeProps } from '@mui/material/styles';
import Tooltip from "@mui/material/Tooltip";
import Grid from '@mui/material/Unstable_Grid2';

import { AppContext } from './AppContext';
import { ROOM_THEME, VIDEO_ROUNDED_CORNERS } from './constants';
import { OutputMessageType } from "./MessageTypes";
import { SwitchFacingModeButton } from './SwitchFacingModeButton';

// import useConversationStreams from "./useConversationStreams";

const VIDEO_SIZING = { height: '100%', maxWidth: '100%' };

export type RoomProps = {
    sx?: SxProps,
    conversation: Conversation,
    stream?: ApiRTCStream,
    onSnapshot?: (contact: Contact, dataUrl: string) => Promise<void>,
    onDisplayChange?: () => void,
    hangUpText?: string,
    shareScreenText?: string
};

const COMPONENT_NAME = "Room";
export function Room(inProps: RoomProps) {

    const { notify } = useContext(AppContext);

    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const { conversation, stream,
        onDisplayChange,
        hangUpText = "HangUp", shareScreenText = "Share screen"
    } = props;

    const [screen, setScreen] = useState<ApiRTCStream>();

    const streamsToPublish = useMemo(() => [...(stream ? [{ stream: stream }] : []), ...(screen ? [{ stream: screen }] : [])],
        [stream, screen]);

    //unpublishAll
    const { publishedStreams, subscribedStreams, unsubscribeAll } = useConversationStreams(
        conversation,
        // Don't do:
        //hasSubscribedStreams ? [...(stream ? [{ stream: stream }] : []), ...(screen ? [{ stream: screen }] : [])] : []
        // Used memoized array instead:
        streamsToPublish
    );

    if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${COMPONENT_NAME}|render|${conversation.getName()}`, stream, publishedStreams, subscribedStreams)
    }

    // useEffect(() => {
    //     if (conversation) {
    //         const on_pointerSharingEnabled = (data: any) => {
    //             if (globalThis.logLevel.isDebugEnabled) {
    //                 console.debug(`${COMPONENT_NAME}|pointerSharingEnabled`, data)
    //             }
    //         };
    //         conversation.on('pointerSharingEnabled', on_pointerSharingEnabled)

    //         const on_pointerLocationChanged = (data: any) => {
    //             if (globalThis.logLevel.isDebugEnabled) {
    //                 console.debug(`${COMPONENT_NAME}|pointerLocationChanged`, data)
    //             }
    //         };
    //         conversation.on('pointerLocationChanged', on_pointerLocationChanged)

    //         conversation.enablePointerSharing(true)

    //         return () => {
    //             conversation.removeListener('pointerSharingEnabled', on_pointerSharingEnabled)
    //             conversation.removeListener('pointerLocationChanged', on_pointerLocationChanged)
    //         }
    //     }
    // }, [conversation])

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

    const screenShare = () => {
        ApiRTCStream.createDisplayMediaStream({}, false).then((localStream: ApiRTCStream) => {
            if (globalThis.logLevel.isInfoEnabled) {
                console.info(`${COMPONENT_NAME}|createDisplayMediaStream`, localStream)
            }
            setScreen(localStream)
        }).catch((error: any) => {
            console.error(`${COMPONENT_NAME}|createDisplayMediaStream error`, error)
        }).finally(() => {
            // setGrabbing(false)
        })
    };

    const stopScreenShare = () => {
        if (screen) {
            screen.release()
            setScreen(undefined)
        }
    };

    useEffect(() => {
        if (screen) {
            screen.on('stopped', () => {
                if (globalThis.logLevel.isInfoEnabled) {
                    console.log(`${COMPONENT_NAME}|The user has ended sharing the screen`);
                }
                setScreen(undefined)
            });
            return () => {
                screen.release()
            }
        }
    }, [screen])

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
            //unpublishAll()
            unsubscribeAll()
        })
    }, [conversation,
        //unpublishAll,
        unsubscribeAll]);

    // const onStreamMouseDown = useCallback((stream: ApiRTCStream, event: React.MouseEvent) => {
    //     if (globalThis.logLevel.isDebugEnabled) {
    //         console.debug(`${COMPONENT_NAME}|onStreamMouseDown`, conversation, stream, event)
    //         console.debug(`${COMPONENT_NAME}|offset`, (event.target as any).offsetLeft, (event.target as any).offsetTop)
    //         console.debug(`${COMPONENT_NAME}|boxRef`, boxRef.current, boxRef?.current?.offsetLeft, boxRef?.current?.offsetTop)
    //     }
    //     // TODO : this does not work very well
    //     // 1- local&distant video may not be same resolution
    //     // 2- local&distant may not be displayed same size
    //     // => should we provide % of height and width instead of pixels
    //     // 3- we have a problem in thi apirtc design to determine on which stream the pointer shall be displayed
    //     // 4- boxRef is not the correct offset if it not the first stream displayed, we should refer to the correct stream parent box...
    //     // we may then need to use an intermediate component...
    //     const x = event.clientX - (boxRef?.current?.offsetLeft ?? 0);
    //     const y = event.clientY - (boxRef?.current?.offsetTop ?? 0);
    //     const left = `${Math.round(x * 100 / (boxRef?.current?.clientWidth || 100))}%`;
    //     const top = `${Math.round(y * 100 / (boxRef?.current?.clientHeight || 100))}%`;
    //     if (globalThis.logLevel.isDebugEnabled) {
    //         console.debug(`${COMPONENT_NAME}|onStreamMouseDown x, y, top, left`, x, y, top, left)
    //     }
    //     // x and y are useless, make it 0, 0 to enforce this
    //     conversation.sendPointerLocation({ streamId: stream.getId() }, 0, 0, { top, left })
    // }, [conversation]);

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
                                    {/* TODO : display TorchButton only if 'environment' facing mode */}
                                    <TorchButton />
                                </>}
                                {stream.hasVideo() && <SnapshotButton options={{ applyRemotely: true }} onSnapshot={(dataUrl: string) => {
                                    if (props.onSnapshot) {
                                        return props.onSnapshot(stream.getContact(), dataUrl)
                                    } else {
                                        return new Promise((resolve) => {
                                            resolve();
                                        })
                                    }
                                }} />}
                                {/* <MuteButton /> */}
                                {stream.hasAudio() && <MuteButton />}
                                {/* {stream.hasAudio() && <AudioEnableButton />}*/}
                                {!stream.isScreensharing() && <AudioEnableButton />}
                                {stream.hasVideo() && !stream.isScreensharing() && <VideoEnableButton />}
                            </>}
                            muted={false}
                            name={`${stream.getContact().getUserData().get('firstName')}${stream.isScreensharing() ? '-screen' : ''}`}
                        // onMouseDown={(event: React.MouseEvent) => {
                        //     event.preventDefault()
                        //     onStreamMouseDown(stream, event)
                        // }}
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
                            <Tooltip title={shareScreenText}>
                                {screen ? <IconButton color='warning'
                                    onClick={stopScreenShare}><StopScreenShareIcon /></IconButton>
                                    : <IconButton color='info'
                                        onClick={screenShare}><ScreenShareIcon /></IconButton>}
                            </Tooltip>
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