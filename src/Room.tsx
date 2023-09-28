import React, { useCallback, useEffect, useState } from "react";

import { Stream as ApiRTCStream, Contact, Conversation } from "@apirtc/apirtc";
import {
    Grid as ApiRtcGrid,
    frFR as ApiRtcMuiReactLib_frFR,
    Audio as AudioComponent, AudioEnableButton,
    MuteButton,
    SnapshotButton,
    Stream, TorchButton, Video, VideoEnableButton
} from "@apirtc/mui-react-lib";
import { useConversationStreams } from "@apirtc/react-lib";

import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import { createTheme, ThemeProvider as MuiThemeProvider, SxProps, useThemeProps } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { ROOM_THEME_OPTIONS, VIDEO_ROUNDED_CORNERS } from './constants';
import { frFR } from './locale/frFR';
import { OutputMessageType } from "./MessageTypes";
import { SwitchFacingModeButton } from './SwitchFacingModeButton';

import inNotification from "./assets/mixkit-bubble-pop-up-alert-notification-2357.wav";
import offNotification from "./assets/mixkit-electric-pop-2365.wav";

const VIDEO_SIZING = { height: '100%', maxWidth: '100%' };

const AUDIO_IN = new Audio(inNotification);
const AUDIO_OFF = new Audio(offNotification);

export type RoomProps = {
    sx?: SxProps,
    conversation: Conversation,
    stream?: ApiRTCStream,
    onSnapshot?: (contact: Contact, dataUrl: string) => Promise<void>,
    // onStart?: (timestamp: number) => void,
    // onEnd?: (durationMilliseconds: number) => void,
    //onSubscribedStreamsSizeChange?: (durationMilliseconds: number) => void,
    onDisplayChange?: () => void,
    hangUpText?: string,
    shareScreenText?: string
};
const COMPONENT_NAME = "Room";
export function Room(inProps: RoomProps) {

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const { conversation, stream,
        onDisplayChange,
        // onSubscribedStreamsSizeChange,
        // onStart, onEnd
        hangUpText = "HangUp", shareScreenText = "Share screen",
    } = props;

    // const boxRef = useRef<HTMLElement>(null);

    const [screen, setScreen] = useState<ApiRTCStream>();

    const [hasSubscribedStreams, setHasSubscribedStreams] = useState<boolean>(false);

    const { publishedStreams, subscribedStreams } = useConversationStreams(
        conversation, hasSubscribedStreams ? [...(stream ? [{ stream: stream }] : []), ...(screen ? [{ stream: screen }] : [])] : []);

    if (globalThis.logLevel.isDebugEnabled) {
        console.debug(`${COMPONENT_NAME}|render|${conversation.getName()}`, stream, publishedStreams, subscribedStreams, hasSubscribedStreams)
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

    //
    // Reduce subscribedStreams.length to a boolean (which can have ony 2 possible values)
    useEffect(() => {
        setHasSubscribedStreams(subscribedStreams.length > 0)
        // if (onSubscribedStreamsSizeChange) {
        //     onSubscribedStreamsSizeChange(subscribedStreams.length)
        // }
        // Notify
        window.parent.postMessage({
            type: OutputMessageType.SubscribedStreams,
            length: subscribedStreams.length,
        }, '*')
    }, [subscribedStreams])//onSubscribedStreamsSizeChange

    useEffect(() => {
        if (hasSubscribedStreams) {
            AUDIO_IN.play().catch((error) => {
                // Don't forget to catch otherwise the page fails in error cases
                if (globalThis.logLevel.isWarnEnabled) {
                    console.warn(`${COMPONENT_NAME}|Audio Error`, error)
                }
            })
            return () => {
                // play sound corresponding to no more subscribedStreams
                AUDIO_OFF.play().catch((error) => {
                    // Don't forget to catch otherwise the page fails in error cases
                    if (globalThis.logLevel.isWarnEnabled) {
                        console.warn(`${COMPONENT_NAME}|Audio Error`, error)
                    }
                })
            }
        }
    }, [hasSubscribedStreams])

    //
    // Manage onStart/onEnd
    // COMMENTED OUT : because linking start/end to hasSubscribedStreams or not may not be accurate
    // as one subscribed stream may go off for a short period during stream break for example...
    // So I replace onStart/onEnd by a more generic onSubscribedStreamsSizeChange to let the application above
    // handle this.
    // Using hasSubscribedStreams value change allows to detect start and end (has or no more has subscribed streams)
    // useEffect(() => {
    //     if (hasSubscribedStreams) {
    //         const start = Date.now();
    //         if (onStart) {
    //             onStart(start)
    //         }
    //         return () => {
    //             // if hasSubscribedStreams was true, it is now false,
    //             // so this is the end of a conversation
    //             if (onEnd) {
    //                 onEnd(Date.now() - start)
    //             }
    //         }
    //     }
    // }, [hasSubscribedStreams, onStart, onEnd]) //onStart, onEnd

    useEffect(() => {
        // This is to externally trigger resize when display changes
        if (onDisplayChange) {
            onDisplayChange()
        }
    }, [onDisplayChange, publishedStreams, subscribedStreams])

    const shareScreen = () => {
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
        const msg = { hangUp: true };
        conversation.sendData(msg).then(() => {
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|hangUp sent`, msg)
            }
        }).catch((error: any) => {
            if (globalThis.logLevel.isWarnEnabled) {
                console.warn(`${COMPONENT_NAME}|hangUp send failure`, error)
            }
        })
    }, [conversation]);

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

    return <MuiThemeProvider theme={createTheme(
        {
            ...ROOM_THEME_OPTIONS,
            typography: {
                button: {
                    textTransform: 'none',
                    letterSpacing: 0.25,
                }
            },
        }, frFR, ApiRtcMuiReactLib_frFR)}>
        {/* <Box sx={{
            ...props.sx,
            position: 'relative',
        }} ref={boxRef}> */}
        <Grid sx={{ ...props.sx }} container spacing={1}>
            <Grid xs={8}>
                <ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
                    {subscribedStreams.map((stream, index) =>
                        <Stream id={'subscribed-stream-' + index} key={index}
                            sx={{
                                ...(stream.hasVideo() ? VIDEO_SIZING : { backgroundColor: 'grey' })
                            }}
                            stream={stream} detectSpeaking={true}
                            controls={<>
                                {stream.hasVideo() && <>
                                    <SwitchFacingModeButton />
                                    {/* TODO : display TorchButton only if 'environment' facing mode */}
                                    <TorchButton />
                                    <SnapshotButton onSnapshot={(dataUrl: string) => {
                                        if (props.onSnapshot) {
                                            return props.onSnapshot(stream.getContact(), dataUrl)
                                        } else {
                                            return new Promise((resolve) => {
                                                resolve();
                                            })
                                        }
                                    }} />
                                </>}
                                <MuteButton />
                                {stream.hasAudio() && <AudioEnableButton />}
                                {stream.hasVideo() && <VideoEnableButton />}
                            </>}
                            muted={false}
                            name={stream.getContact().getUserData().get('firstName')}
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
            </Grid>
            {/* <ApiRtcGrid sx={{
                position: 'absolute',
                bottom: '4px', left: '4px',
                opacity: 0.9,
                height: '50%', width: { xs: '50%', sm: '40%', md: '30%', lg: '20%' },
            }}> */}
            <Grid xs={4}>
                <Stack direction="column" spacing={1} >
                    <ApiRtcGrid sx={{ height: '100%', width: '100%' }}>
                        {publishedStreams.map((stream, index) =>
                            <Stream id={'published-stream-' + index} key={index}
                                sx={{
                                    ...(stream.hasVideo() ? VIDEO_SIZING : { backgroundColor: 'grey' })
                                }}
                                stream={stream} muted={true}
                                controls={<><AudioEnableButton />{stream.hasVideo() && <VideoEnableButton />}</>}>
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
                    {
                        subscribedStreams.length > 0 &&
                        <Stack direction='column' alignItems='center'>
                            <Button sx={{ mt: 2 }} variant='outlined'
                                onClick={shareScreen}>{shareScreenText}</Button>
                            <Button sx={{ mt: 2 }} variant='outlined' color='error'
                                onClick={hangUp}>{hangUpText}</Button>
                        </Stack>
                    }
                </Stack>
                {/* </ApiRtcGrid> */}
            </Grid>
            {/* </Box > */}
        </Grid>
    </MuiThemeProvider>
}