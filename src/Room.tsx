import React, { useCallback, useEffect, useRef, useState } from "react";

import { Stream as ApiRTCStream, Contact, Conversation } from "@apirtc/apirtc";
import {
    Grid as ApiRtcGrid,
    frFR as ApiRtcMuiReactLib_frFR,
    Audio, AudioEnableButton,
    MuteButton,
    SnapshotButton,
    Stream, TorchButton, Video, VideoEnableButton
} from "@apirtc/mui-react-lib";
import { useConversationStreams } from "@apirtc/react-lib";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from "@mui/material/Stack";
import { createTheme, ThemeProvider as MuiThemeProvider, SxProps, useThemeProps } from '@mui/material/styles';

import { frFR } from './locale/frFR';
import { ROOM_THEME_OPTIONS, VIDEO_ROUNDED_CORNERS } from './constants';
import { SwitchFacingModeButton } from './SwitchFacingModeButton';

const VIDEO_SIZING = { height: '100%', maxWidth: '100%' };

export type RoomProps = {
    sx?: SxProps,
    conversation: Conversation,
    stream?: ApiRTCStream,
    onSnapshot?: (contact: Contact, dataUrl: string) => Promise<void>,
    onStart?: (timestamp: number) => void,
    onEnd?: (durationMilliseconds: number) => void,
    onDisplayChange?: () => void,
    hangUpText?: string
};
const COMPONENT_NAME = "Room";
export function Room(inProps: RoomProps) {

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const { conversation, hangUpText = "HangUp" } = props;

    const boxRef = useRef<HTMLElement>(null);

    const [hasSubscribedStreams, setHasSubscribedStreams] = useState<boolean>(false);

    const { publishedStreams, subscribedStreams } = useConversationStreams(
        conversation, props.stream && hasSubscribedStreams ? [{ stream: props.stream }] : []);

    const [start, setStart] = useState(0);

    useEffect(() => {
        if (conversation) {
            const on_pointerSharingEnabled = (data: any) => {
                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|pointerSharingEnabled`, data)
                }
            };
            conversation.on('pointerSharingEnabled', on_pointerSharingEnabled)

            const on_pointerLocationChanged = (data: any) => {
                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|pointerLocationChanged`, data)
                }
            };
            conversation.on('pointerLocationChanged', on_pointerLocationChanged)

            conversation.enablePointerSharing(true)

            return () => {
                conversation.removeListener('pointerSharingEnabled', on_pointerSharingEnabled)
                conversation.removeListener('pointerLocationChanged', on_pointerLocationChanged)
            }
        }
    }, [conversation])

    // Manage onStart/onEnd
    //
    useEffect(() => {
        setHasSubscribedStreams((prev: boolean) => {
            if (prev === false && subscribedStreams.length > 0) {
                const now = Date.now();
                if (props.onStart) {
                    props.onStart(now)
                }
                setStart(now)
            } else if (prev === true && subscribedStreams.length === 0) {
                if (props.onEnd) {
                    props.onEnd(Date.now() - start)
                }
            }

            return subscribedStreams.length > 0;
        })
    }, [subscribedStreams])

    useEffect(() => {
        // This is to externally trigger resize when display changes
        if (props.onDisplayChange) {
            props.onDisplayChange()
        }
    }, [publishedStreams, subscribedStreams])

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

    const onStreamMouseDown = useCallback((stream: ApiRTCStream, event: React.MouseEvent) => {
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|onStreamMouseDown`, conversation, stream, event)
            console.debug(`${COMPONENT_NAME}|offset`, (event.target as any).offsetLeft, (event.target as any).offsetTop)
            console.debug(`${COMPONENT_NAME}|boxRef`, boxRef.current, boxRef?.current?.offsetLeft, boxRef?.current?.offsetTop)
        }
        // TODO : this does not work very well
        // 1- local&distant video may not be same resolution
        // 2- local&distant may not be displayed same size
        // => should we provide % of height and width instead of pixels
        // 3- we have a problem in thi apirtc design to determine on which stream the pointer shall be displayed
        // 4- boxRef is not the correct offset if it not the first stream displayed, we should refer to the correct stream parent box...
        // we may then need to use an intermediate component...
        const x = event.clientX - (boxRef?.current?.offsetLeft ?? 0);
        const y = event.clientY - (boxRef?.current?.offsetTop ?? 0);
        const left = `${Math.round(x * 100 / (boxRef?.current?.clientWidth || 100))}%`;
        const top = `${Math.round(y * 100 / (boxRef?.current?.clientHeight || 100))}%`;
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|onStreamMouseDown x, y, top, left`, x, y, top, left)
        }
        // x and y are useless, make it 0, 0 to enforce this
        conversation.sendPointerLocation({ streamId: stream.getId() }, 0, 0, { top, left })
    }, [conversation]);

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
        <Box sx={{
            ...props.sx,
            position: 'relative',
        }} ref={boxRef}>
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
                        onMouseDown={(event: React.MouseEvent) => {
                            event.preventDefault()
                            onStreamMouseDown(stream, event)
                        }}>
                        {stream.hasVideo() ? <Video
                            sx={{ ...VIDEO_SIZING }}
                            style={{
                                ...VIDEO_SIZING,
                                ...VIDEO_ROUNDED_CORNERS,
                                objectFit: 'cover'
                            }} /> : <Audio />}
                    </Stream>)}
            </ApiRtcGrid>
            <ApiRtcGrid sx={{
                position: 'absolute',
                bottom: '4px', left: '4px',
                opacity: 0.9,
                height: '50%', width: { xs: '50%', sm: '40%', md: '30%', lg: '20%' },
            }}>
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
                            <Audio />}
                    </Stream>
                )}
            </ApiRtcGrid>
        </Box >
        {
            subscribedStreams.length > 0 &&
            <Stack direction='column' alignItems='center'>
                <Button sx={{ mt: 2 }} variant='outlined' color='error'
                    onClick={hangUp}>{hangUpText}</Button>
            </Stack>
        }
    </MuiThemeProvider>
}