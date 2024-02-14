import { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Contact, JoinOptions, RegisterInformation, UserData } from '@apirtc/apirtc';
import { Audio, MediaDeviceSelect, Stream, Video, useToggle } from '@apirtc/mui-react-lib';
import { Credentials, useCameraStream, useConversation, useConversationContacts, useSession, useStreamApplyAudioProcessor, useStreamApplyVideoProcessor, useUserMediaDevices } from '@apirtc/react-lib';

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { ThemeProvider as MuiThemeProvider, createTheme, useThemeProps } from '@mui/material/styles';

import LogRocket from 'logrocket';

import { Invitation } from './Invitation';
import { Room } from './Room';

import { AppContext } from './AppContext';
import { OutputMessageType } from './MessageTypes';
import { TimelineContext } from './TimelineContext';
import { CODECS, VIDEO_ROUNDED_CORNERS } from './constants';
import { getFromLocalStorage, setLocalStorage } from './local-storage';
import { TimelineEvent } from './types';
import { Timeline } from './Timeline';

const SETTINGS_THEME = createTheme({
    components: {
        MuiIconButton: {
            variants: [
                {
                    props: {},
                    style: {
                        padding: 4,
                        margin: 2,
                        color: '#2E455C',
                        backgroundColor: '#F7F7F8',
                        borderRadius: '4px',
                        border: '2px solid #2E455C',
                        ':hover': {
                            color: '#1D2C3A',
                            backgroundColor: 'D3DEE9',
                        },
                        ':disabled': {
                            color: '#7A8085',
                            backgroundColor: '#CACCCE',
                        }
                    },
                },
            ],
        },
    }
});

const const_conversationOptions = {
    // moderationEnabled: true, moderator: true,
    meshModeEnabled: true
};

enum MenuValues {
    Invite = 'invite',
    Settings = 'settings',
    Timeline = 'timeline'
}

export type AppProps = {
    blurLabel?: string,
    noiseReductionLabel?: string,
    invitationLabel?: string,
    timelineLabel?: string,
    settingsLabel?: string,
    audioOffTooltip?: string,
    audioOnTooltip?: string,
    videoOffTooltip?: string,
    videoOnTooltip?: string,
    contactJoined?: string,
    contactLeft?: string,
    noConversationText?: string
};
const COMPONENT_NAME = "App";
export function App(inProps: AppProps) {

    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const { blurLabel = "Blur", noiseReductionLabel = "Noise reduction",
        invitationLabel = "Invite", timelineLabel = "Timeline", settingsLabel = "My settings",
        audioOffTooltip = "Audio Off", audioOnTooltip = "Audio On", videoOffTooltip = "Video Off", videoOnTooltip = "Video On",
        // getSnapshotComment = (name: string) => `Snapshot from ${name}.`
        contactJoined = "joined conversation", contactLeft = "left",
        noConversationText = 'Session and Conversation name required'
    } = props;

    const { appConfig, userData,
        audio,
        connect, join, conversationName,
        notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const { value: withAudio, toggle: toggleAudio } = useToggle(audio ? (/true/i).test(getFromLocalStorage(`${installationId}.withAudio`, 'true')) : false);
    const { value: withVideo, toggle: toggleVideo } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.withVideo`, 'true')));
    useEffect(() => {
        setLocalStorage(`${installationId}.withAudio`, `${withAudio}`)
        setLocalStorage(`${installationId}.withVideo`, `${withVideo}`)
    }, [installationId, withAudio, withVideo])

    const { value: blur, toggle: toggleBlur } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.blur`, 'false')));
    const { value: noiseReduction, toggle: toggleNoiseReduction } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.noiseReduction`, 'false')));
    useEffect(() => {
        setLocalStorage(`${installationId}.blur`, `${blur}`)
        setLocalStorage(`${installationId}.noiseReduction`, `${noiseReduction}`)
    }, [installationId, blur, noiseReduction])

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

    const sessionErrorCallback = useCallback((error: any) => {
        console.error(`${COMPONENT_NAME}|useSession error`, error)
        notify({
            type: OutputMessageType.Error,
            reason: `ApiRTC session failed`
        })
    }, [notify]);

    const { session } = useSession(connect ? credentials : undefined,
        registerInformation,
        sessionErrorCallback
    );

    const { userMediaDevices,
        selectedAudioIn, selectedAudioInId, setSelectedAudioIn,
        selectedVideoIn, selectedVideoInId, setSelectedVideoIn } = useUserMediaDevices(session, installationId);

    const createStreamOptions = useMemo(() => {
        return {
            // does it makes sens to set it also here ?
            // what does apirtc do differently than with constraints only ?
            // ...(withAudio && selectedAudioInId && { audioInputId: selectedAudioInId }),
            // ...(withVideo && selectedVideoInId && { videoInputId: selectedVideoInId }),
            //
            constraints: {
                audio: withAudio ? {
                    ...(selectedAudioInId && { deviceId: selectedAudioInId }),
                    echoCancellation: true,
                    noiseSuppression: true,
                } : false,
                video: withVideo && selectedVideoInId ? {
                    deviceId: selectedVideoInId
                } : withVideo
            }
        }
    }, [withAudio, withVideo, selectedAudioInId, selectedVideoInId]);

    // const cameraErrorCallback = useCallback((error: any) => {
    //     if (globalThis.logLevel.isWarnEnabled) {
    //         console.warn(`${COMPONENT_NAME}|useCameraStream error`, error);
    //     }
    //     notify({
    //         type: OutputMessageType.Error,
    //         reason: error.message
    //     })
    // }, [notify]);

    const { stream: cameraStream, grabbing, error: cameraError } = useCameraStream(
        (withAudio || withVideo) ? session : undefined,
        createStreamOptions); // cameraErrorCallback

    // Does not work fine due to apirtc bug :
    // https://apizee.atlassian.net/browse/APIRTC-1366
    const { stream: cameraStream2, error: noiseReductionError } = useStreamApplyAudioProcessor(
        cameraStream,
        noiseReduction ? 'noiseReduction' : 'none');

    // applied: appliedVideoProcessorType
    const { stream, error: blurError } = useStreamApplyVideoProcessor(
        cameraStream2,
        blur ? 'blur' : 'none'); //videoProcessorErrorCallback

    //const blurred = appliedVideoProcessorType === 'blur';

    const { conversation, joined } = useConversation(session,
        conversationName,
        // no need for using useState nor useMemo as longs as the value is a constant
        const_conversationOptions,
        join,
        // TODO: supportedVideoCodecs is not yet documented nor exposed as a possible JoinOptions in apirtc typings
        // thus we need to force type with 'as'
        // no need for using useState as longs as the value is a constant
        CODECS as JoinOptions
    );

    // R&D: local timeline events
    //
    const [timelineEvents, setTimelineEvents] = useState<Array<TimelineEvent>>([]);
    const addTimelineEvent = useCallback((event: TimelineEvent) => {
        setTimelineEvents((l_timelines) => [event, ...l_timelines])
    }, []);

    // use useCallbacks here to avoid useConversationContacts re-renders
    const onContactJoined = useCallback((contact: Contact) => {
        addTimelineEvent({ severity: 'info', name: contact.getUserData().get('firstName'), message: contactJoined, dateTime: new Date() })
    }, [addTimelineEvent, contactJoined]);
    const onContactLeft = useCallback((contact: Contact) => {
        addTimelineEvent({ severity: 'warning', name: contact.getUserData().get('firstName'), message: contactLeft, dateTime: new Date() })
    }, [addTimelineEvent, contactLeft]);

    //const { contacts } =
    useConversationContacts(conversation, onContactJoined, onContactLeft);

    // number of subscribed streams boolean projection
    const [hasSubscribedStreams, setHasSubscribedStreams] = useState<boolean>(false);

    // manage menu
    const [menuValue, setMenuValue] = useState<MenuValues | undefined>(MenuValues.Invite);
    const handleMenu = (event: React.MouseEvent<HTMLElement>, newValue: MenuValues) => {
        setMenuValue(newValue);
        // Notify parent resize might be relevant
        notify({
            type: OutputMessageType.Resize
        })
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

    // Conversation.onData handling
    //
    // - receive timeline events sent from guest app
    //
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
                        addTimelineEvent({
                            severity: 'info',
                            name: sender.getUserData().get('firstName'),
                            message: `${content.event}`,
                            dateTime: new Date()
                        })
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
    }, [conversation, addTimelineEvent]);

    useEffect(() => {
        // Notify about Conversation join status
        if (joined) {
            notify({
                type: OutputMessageType.Joined
            })
            return () => {
                notify({
                    type: OutputMessageType.Left
                })
            }
        }
    }, [notify, joined])

    useEffect(() => {
        // Notify parent resize might be necessary
        notify({
            type: OutputMessageType.Resize
        })
    }, [notify, stream])

    useEffect(() => {
        if (stream) {
            stream.on('trackStopped', (event: any) => {
                if (globalThis.logLevel.isWarnEnabled) {
                    console.warn(`${COMPONENT_NAME}|stream trackStopped`, event);
                }
                // Notify
                notify({
                    type: OutputMessageType.Warning,
                    reason: `camera ${event.type} track ${event.reason}`,
                })
            });
        }
    }, [notify, stream])

    const onSnapshot = useCallback((contact: Contact, dataUrl: string) => {
        // Record timeline event for snapshot
        addTimelineEvent({ severity: 'info', name: contact.getUserData().get('firstName'), message: 'snapshot', dataUrl, dateTime: new Date() })
        // notify parent
        return new Promise<void>((resolve) => {
            const message = {
                type: OutputMessageType.Snapshot,
                contact: {
                    id: contact.getId(),
                    userData: contact.getUserData()
                },
                dataUrl
            };
            notify(message)
            if (globalThis.logLevel.isDebugEnabled) {
                console.debug(`${COMPONENT_NAME}|onSnapshot postMessage done`, message)
            }
            resolve();
        });
    }, [notify, addTimelineEvent]);

    const onSubscribedStreamsLengthChange = (length: number) => {
        setHasSubscribedStreams(length > 0)
        // Notify
        notify({
            type: OutputMessageType.SubscribedStreams,
            length,
        })
    };

    useEffect(() => {
        setMenuValue((prev) => {
            // when some subscribed streams appear, clear the menu selection
            if (hasSubscribedStreams) return undefined
            // when there are no more subscribed streams
            // If a menu is selected, keep this one
            if (prev) {
                return prev
            }
            // otherwise go to invite
            return MenuValues.Invite
        })
    }, [hasSubscribedStreams])

    const _settingsErrors = useMemo(() => [
        // ...(cameraError ? [cameraError.name === 'NotAllowedError' ? 'Please authorize device(s) access' : cameraError.message] : []),
        ...(cameraError ? ['Please check a device is available and not already grabbed by another software'] : []),
        ...(noiseReductionError ? [`Noise reduction error : ${noiseReductionError}`] : []),
        ...(blurError ? [`Blur error : ${blurError}`] : []),
        ...(withAudio && !grabbing && stream && !stream.hasAudio() ? ["Failed to grab audio"] : []),
        ...(withVideo && !grabbing && stream && !stream.hasVideo() ? ["Failed to grab video: Please check a device is available and not already grabbed by another software"] : [])
    ], [stream, grabbing, cameraError, noiseReductionError, blurError, withAudio, withVideo])

    // Kind of debounce the settingsErrors_ to prevent BadgeError to show
    // between withAudio/Video toggle and grabbing
    const settingsErrors = useDeferredValue(_settingsErrors);

    useEffect(() => {
        setMenuValue((prev) => {
            // when some subscribed streams appear, clear the menu selection
            if (settingsErrors.length !== 0) return MenuValues.Settings
            // when there are no more errors
            // If a menu is selected, keep this one
            if (prev) {
                return prev
            }
            // otherwise go to invite
            return MenuValues.Invite
        })
    }, [settingsErrors])

    const renderMenuContent = () => {
        switch (menuValue) {
            case MenuValues.Settings:
                return <MuiThemeProvider theme={SETTINGS_THEME}>
                    <Stack direction="column" spacing={1}>
                        <Stack direction={{ xs: 'column', sm: 'row' }}
                            alignItems='center' justifyContent='center'
                            spacing={2}>
                            {grabbing && !stream && <Skeleton variant="rectangular" width={237} height={178} />}
                            {stream && <Stream sx={{ maxWidth: '237px', maxHeight: '260px' }}
                                stream={stream} muted={true}>
                                {stream.hasVideo() ? <Video style={{ maxWidth: '100%', ...VIDEO_ROUNDED_CORNERS }}
                                    data-testid={`video - ${conversationName}`} /> : <Audio data-testid={`audio - ${conversationName}`} />}
                            </Stream>}
                            <Stack spacing={1}>
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
                                        disabled={!withVideo}
                                        devices={userMediaDevices.videoinput}
                                        selectedDevice={selectedVideoIn}
                                        setSelectedDevice={setSelectedVideoIn} />
                                </Stack>
                                <Stack>
                                    <FormControlLabel control={<Switch
                                        checked={blur}
                                        onChange={toggleBlur}
                                        inputProps={{ 'aria-label': blur ? 'blurred' : 'not-blurred' }}
                                    />} label={blurLabel} />
                                    {/* <FormControlLabel control={<Switch
                                        checked={noiseReduction}
                                        onChange={toggleNoiseReduction}
                                        inputProps={{ 'aria-label': noiseReduction ? 'noise-reduction' : 'no-noise-reduction' }}
                                    />} label={noiseReductionLabel} /> */}
                                </Stack>
                            </Stack>
                        </Stack>
                        {settingsErrors.length !== 0 &&
                            <Stack direction="column"
                                justifyContent="center" alignItems="center"
                                spacing={1}>
                                {
                                    settingsErrors.map((entry: string, index: number) =>
                                        <Alert key={index} variant='outlined' severity='error'>{entry}</Alert>)
                                }
                            </Stack>
                        }
                    </Stack>

                </MuiThemeProvider>
            case MenuValues.Invite:
                return <>
                    {connect && conversationName ?
                        <Stack direction="row"
                            justifyContent="center" alignItems="center">
                            {session ?
                                <Invitation sx={{ mt: 1 }} session={session} conversationName={conversationName}></Invitation> :
                                <Skeleton variant="rectangular" width={345} height={226} />
                            }
                        </Stack> :
                        <Alert severity="warning">{noConversationText}</Alert>
                    }
                </>
            case MenuValues.Timeline:
                return <Timeline events={timelineEvents}/>
            default:
                // do not display anything
                return;
        }
    };

    return <TimelineContext.Provider value={{ addTimelineEvent }}>
        <Stack direction="row" sx={{ px: 1, py: 1 }}
            justifyContent="center" alignItems="center">
            {/* <Icon>
                <img src={logo} alt="Apirtc" width="100%" height="auto" />
            </Icon> */}
            <ToggleButtonGroup size="small" aria-label="Menu"
                value={menuValue}
                exclusive
                onChange={handleMenu}>
                <ToggleButton value={MenuValues.Invite} aria-label={invitationLabel}>
                    <Tooltip title={invitationLabel}>
                        <PersonAddIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value={MenuValues.Timeline} aria-label={timelineLabel}>
                    <Tooltip title={timelineLabel}>
                        <ViewTimelineIcon />
                    </Tooltip>
                </ToggleButton>
                <ToggleButton value={MenuValues.Settings} aria-label={settingsLabel}>
                    <Tooltip title={settingsLabel}>
                        {settingsErrors.length !== 0 ?
                            <Badge color="error" badgeContent={settingsErrors.length}>
                                <VideoSettingsIcon />
                            </Badge> :
                            <VideoSettingsIcon />}
                    </Tooltip>
                </ToggleButton>
            </ToggleButtonGroup>
        </Stack>

        {renderMenuContent()}

        {menuValue && hasSubscribedStreams && <Divider sx={{ m: 2 }} />}

        {conversation && <Room sx={{
            mt: 1, px: 1,
            minHeight: '100%', width: '100%',
        }}
            conversation={conversation}
            stream={stream}
            onSnapshot={onSnapshot}
            onDisplayChange={() => {
                notify({
                    type: OutputMessageType.Resize
                })
            }}
            onSubscribedStreamsLengthChange={onSubscribedStreamsLengthChange}
        />}
    </TimelineContext.Provider>
}