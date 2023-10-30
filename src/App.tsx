import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Contact, RegisterInformation, UserData } from '@apirtc/apirtc';
import { Audio, MediaDeviceSelect, Stream, Video, useToggle } from '@apirtc/mui-react-lib';
import { Credentials, useCameraStream, useConversation, useConversationContacts, useSession, useUserMediaDevices } from '@apirtc/react-lib';

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import Alert, { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider as MuiThemeProvider, createTheme, useThemeProps } from '@mui/material/styles';

import LogRocket from 'logrocket';

import { AppContext } from './AppContext';
import { Invitation } from "./Invitation";
import { OutputMessageType } from './MessageTypes';
import { Room } from "./Room";
import { CODECS, VIDEO_ROUNDED_CORNERS } from './constants';
import { getFromLocalStorage, setLocalStorage } from './local-storage';

// TODO: publish timeline events with postMessage for iframe host to know about them !
// Needs more standardization probably !
export type TimelineEvent = {
    severity: AlertColor,
    contact: Contact,
    message: string,
    dateTime: Date
};

const SETTINGS_THEME = createTheme({
    components: {
        MuiIconButton: {
            variants: [
                {
                    props: {},
                    style: {
                        padding: 4,
                        margin: 2,
                        // color: '#111313',
                        // backgroundColor: '#F76B40',
                        // borderRadius: '4px',
                        color: '#2E455C',
                        backgroundColor: '#F7F7F8',
                        borderRadius: '4px',
                        border: '2px solid #2E455C',
                        // opacity: '75%',
                        ':hover': {
                            //backgroundColor: '#F88562',
                            color: '#1D2C3A',
                            backgroundColor: 'D3DEE9',
                            // opacity: '100%',
                        },
                        ':disabled': {
                            color: '#7A8085',
                            backgroundColor: '#CACCCE',
                            // opacity: '75%',
                        }
                    },
                },
            ],
        },
    }
});

export type AppProps = {
    invitationLabel?: string,
    timelineLabel?: string,
    settingsLabel?: string,
    audioOffTooltip?: string,
    audioOnTooltip?: string,
    videoOffTooltip?: string,
    videoOnTooltip?: string,
    // getSnapshotComment?: (name: string) => string,
};
const COMPONENT_NAME = "App";
export function App(inProps: AppProps) {

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const { invitationLabel = "Invite", timelineLabel = "Timeline", settingsLabel = "My settings",
        audioOffTooltip = "Audio Off", audioOnTooltip = "Audio On", videoOffTooltip = "Video Off", videoOnTooltip = "Video On"
        // getSnapshotComment = (name: string) => `Snapshot from ${name}.`
    } = props;

    const { appConfig, userData,
        audio,
        connect, join, conversationName,
        notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const { value: withAudio, toggle: toggleAudio } = useToggle(audio ? (/true/i).test(getFromLocalStorage(`${installationId}.withAudio`, 'false')) : false);
    const { value: withVideo, toggle: toggleVideo } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.withVideo`, 'false')));
    useEffect(() => {
        setLocalStorage(`${installationId}.withAudio`, `${withAudio}`)
        setLocalStorage(`${installationId}.withVideo`, `${withVideo}`)
    }, [installationId, withAudio, withVideo])

    const registerInformation: RegisterInformation = useMemo(() => {
        return {
            // do not set at all id in undefined
            ...userData?.userId && { id: userData?.userId },
            userData: new UserData({
                type: "agent",// this, combined with username, might help to count number of agents using the service ?
                ...userData
            }),
            cloudUrl: appConfig.apiRtc.cloudUrl
        }
    }, [appConfig, userData]);

    const credentials: Credentials | undefined = useMemo(() => {
        if (appConfig.apiRtc.apiKey && appConfig.apiRtc.apiKey !== '') {
            return { apiKey: appConfig.apiRtc.apiKey }
        } else {
            return undefined
        }
    }, [appConfig]);

    const { session } = useSession(connect ? credentials : undefined,
        registerInformation,
        (error) => {
            console.error(`${COMPONENT_NAME}|useSession error`, error)
            //client.invoke('notify', `ApiRtc session failed`, 'error')
            notify('error', `ApiRtc session failed`)
        });

    const { userMediaDevices,
        selectedAudioIn, setSelectedAudioIn,
        selectedVideoIn, setSelectedVideoIn } = useUserMediaDevices(session, installationId);

    const constraints = useMemo(() => {
        return {
            audio: withAudio ? {
                ...(selectedAudioIn && { deviceId: selectedAudioIn.id }),
                echoCancellation: true,
                noiseSuppression: true,
            } : false,
            video: withVideo && selectedVideoIn ? {
                deviceId: selectedVideoIn.id
            } : withVideo
        }
    }, [withAudio, withVideo, selectedAudioIn, selectedVideoIn]);

    const { stream, grabbing } = useCameraStream((withAudio || withVideo) ? session : undefined,
        {
            // BUG@apirtc: audioInputId and videoInputId actually modify the CreateStreamOptions (it is not immutable), so the options object change
            // and re-triggers rendering. To prevent this, build a constraints object using deviceId directly.
            //audioInputId: selectedAudioIn?.id,
            //videoInputId: selectedVideoIn?.id,
            constraints: constraints
        });

    const { conversation, joined } = useConversation(session, conversationName,
        {
            meshModeEnabled: true
        },
        join,
        // TODO: supportedVideoCodecs is not yet documented nor exposed as a possible JoinOptions in apirtc typings
        // thus we need to add 'as any'
        { ...CODECS } as any);

    const [timelines, setTimelines] = useState<Array<TimelineEvent>>([]);

    const onContactJoined = useCallback((contact: Contact) => {
        setTimelines((l_timelines) => [{ severity: 'info', contact, message: `enters app`, dateTime: new Date() }, ...l_timelines])
    }, [setTimelines]);

    const onContactLeft = useCallback((contact: Contact) => {
        setTimelines((l_timelines) => [{ severity: 'warning', contact, message: `left`, dateTime: new Date() }, ...l_timelines])
    }, [setTimelines]);

    const { contacts } = useConversationContacts(conversation, onContactJoined, onContactLeft);

    const postResize = () => {
        // Notify parent about resize
        window.parent.postMessage({
            type: OutputMessageType.Resize
        }, '*')
    };

    const [menuValue, setMenuValue] = useState<'invite' | 'timeline' | 'settings' | undefined>('invite');
    const handleMenu = (event: React.MouseEvent<HTMLElement>, newValue: 'invite' | 'settings') => {
        setMenuValue(newValue);
        postResize();
    };

    useEffect(() => {
        if (conversationName && session) {
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|logRocket identify`, conversationName, session.getId());
            }
            LogRocket.identify(`${conversationName}-${session.getId()}`);
        }
    }, [conversationName, session])

    useEffect(() => {
        if (session) {
            // enable callStatsMonitoring for support
            session.getUserAgent().enableCallStatsMonitoring(appConfig.apiRtc.callStatsMonitoringInterval !== undefined, { interval: appConfig.apiRtc.callStatsMonitoringInterval })
        }
    }, [session, appConfig])

    useEffect(() => {
        if (conversation) {
            // To receive data from contacts in the Conversation
            const onData = (dataInfo: any) => {
                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|Conversation onData`, dataInfo);
                }

                const sender: Contact = dataInfo.sender;
                const content: any = dataInfo.content;

                switch (content.type) {
                    case 'timeline-event':
                        setTimelines((l_timelines) => [
                            {
                                severity: 'info',
                                contact: sender,
                                message: `${content.event}`,
                                dateTime: new Date()
                            }, ...l_timelines])
                        break;
                    default:
                        if (globalThis.logLevel.isWarnEnabled) {
                            console.warn(`${COMPONENT_NAME}|Conversation onData unhandled type`, dataInfo);
                        }
                        break;
                }
            };
            conversation.on('data', onData);
            return () => {
                conversation.removeListener('data', onData);
            };
        }
    }, [conversation]);

    useEffect(() => {
        // Notify about Conversation join status
        if (joined) {
            window.parent.postMessage({
                type: OutputMessageType.Joined
            }, '*')
            return () => {
                window.parent.postMessage({
                    type: OutputMessageType.Left
                }, '*')
            }
        }
    }, [joined])

    useEffect(() => {
        postResize();
    }, [stream])

    const onSnapshot = useCallback((contact: Contact, dataUrl: string) => {
        return new Promise<void>((resolve, reject) => {
            const message = {
                type: OutputMessageType.Snapshot,
                contact: {
                    id: contact.getId(),
                    userData: contact.getUserData()
                },
                dataUrl
            };
            window.parent.postMessage(message, '*')
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|onSnapshot postMessage done`, message)
            }
            resolve();
        });
    }, []);

    const [hasSubscribedStreams, setHasSubscribedStreams] = useState<boolean>(false);

    const onSubscribedStreamsLengthChange = (length: number) => {
        setHasSubscribedStreams(length > 0)
        // Notify
        window.parent.postMessage({
            type: OutputMessageType.SubscribedStreams,
            length,
        }, '*')
    };

    useEffect(() => {
        if (hasSubscribedStreams) {
            // when some subscribed streams appear, clear the menu selection
            setMenuValue(undefined)
        } else {
            // when there are no more subscribed streams
            setMenuValue((prev) => {
                // If a menu is selected, keep this one
                if (prev) {
                    return prev
                }
                // otherwise go to invite
                return 'invite'
            })
        }
    }, [hasSubscribedStreams])

    return <>
        <Stack direction="row" sx={{ px: 1, py: 1 }}
            justifyContent="center" alignItems="center">
            {/* <Icon>
                <img src={logo} alt="Apirtc" width="100%" height="auto" />
            </Icon> */}
            <ToggleButtonGroup size="small" aria-label="Menu"
                value={menuValue}
                exclusive
                onChange={handleMenu}>
                <ToggleButton value="invite" aria-label={invitationLabel}>
                    <Tooltip title={invitationLabel}>
                        <PersonAddIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value="timeline" aria-label={timelineLabel}>
                    <Tooltip title={timelineLabel}>
                        <ViewTimelineIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value="settings" aria-label={settingsLabel}>
                    <Tooltip title={settingsLabel}>
                        <VideoSettingsIcon />
                    </Tooltip>
                </ToggleButton>
            </ToggleButtonGroup>
        </Stack>

        {menuValue === 'settings' &&
            <MuiThemeProvider theme={SETTINGS_THEME}>
                <Stack direction={{ xs: 'column', sm: 'row' }}
                    alignItems='center' justifyContent='center'
                    spacing={2}>
                    {grabbing && !stream && <Skeleton variant="rectangular" width={237} height={178} />}
                    {stream && <Stream sx={{ maxWidth: '237px', maxHeight: '260px' }}
                        stream={stream} muted={true}>
                        {stream.hasVideo() ? <Video style={{ maxWidth: '100%', ...VIDEO_ROUNDED_CORNERS }}
                            data-testid={`video-${conversationName}`} /> : <Audio data-testid={`audio-${conversationName}`} />}
                    </Stream>}
                    <Stack spacing={2}>
                        {audio &&
                            <Stack direction="row" spacing={1}>
                                <Tooltip title={withAudio ? audioOnTooltip : audioOffTooltip}>
                                    <IconButton data-testid='audio-btn'
                                        color='primary' size='small'
                                        disabled={session ? undefined : true}
                                        onClick={toggleAudio}>{withAudio ? <MicIcon /> : <MicOffIcon />}</IconButton>
                                </Tooltip>
                                <MediaDeviceSelect sx={{ mt: 1, minWidth: '120px', maxWidth: '240px' }}
                                    id='audio-in'
                                    size='small'
                                    // label={audioInLabel}
                                    disabled={!withAudio}
                                    devices={userMediaDevices.audioinput}
                                    selectedDevice={selectedAudioIn}
                                    setSelectedDevice={setSelectedAudioIn} />
                            </Stack>}
                        <Stack direction="row" spacing={1}>
                            <Tooltip title={withVideo ? videoOnTooltip : videoOffTooltip}>
                                <IconButton data-testid='video-btn'
                                    color='primary' size='small'
                                    disabled={session ? undefined : true}
                                    onClick={toggleVideo}>{withVideo ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
                            </Tooltip>
                            <MediaDeviceSelect sx={{ mt: 1, minWidth: '120px', maxWidth: '240px' }}
                                id='video-in'
                                size='small'
                                // label={videoInLabel}
                                disabled={!withVideo}
                                devices={userMediaDevices.videoinput}
                                selectedDevice={selectedVideoIn}
                                setSelectedDevice={setSelectedVideoIn} />
                        </Stack>
                    </Stack>
                </Stack>
            </MuiThemeProvider>}

        {menuValue === 'invite' && <>
            {connect && conversationName ?
                <Stack direction="row"
                    justifyContent="center" alignItems="center">
                    {session ?
                        <Invitation sx={{ mt: 1 }} session={session} conversationName={conversationName}></Invitation> :
                        <Skeleton variant="rectangular" width={345} height={226} />
                    }
                </Stack> :
                <Alert severity="warning">Invitation requires connection and conversation name</Alert>
            }
        </>}

        {menuValue === 'timeline' && <Box alignItems='center' justifyContent='center'>
            <Stack direction="column"
                justifyContent="center" alignItems="center"
                spacing={1}>
                {timelines.map((event: TimelineEvent, index: number) =>
                    <Alert key={index} variant='outlined' severity={event.severity}>{`${event.contact.getUserData().get('firstName')} ${event.message} at ${event.dateTime.toLocaleString()}`}</Alert>
                )}
            </Stack>
        </Box>}

        {menuValue && hasSubscribedStreams && <Divider sx={{ m: 2 }} />}

        {conversation && <Room sx={{
            mt: 1, px: 1,
            minHeight: '100%', width: '100%',
        }}
            conversation={conversation}
            stream={stream}
            onSnapshot={onSnapshot}
            onDisplayChange={postResize}
            onSubscribedStreamsLengthChange={onSubscribedStreamsLengthChange}
        />}
    </>
}