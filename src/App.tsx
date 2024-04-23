import { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Contact, JoinOptions, RegisterInformation, UserData } from '@apirtc/apirtc';
import { useToggle } from '@apirtc/mui-react-lib';
import { Credentials, useCameraStream, useConversation, useConversationContacts, useSession, useUserMediaDevices } from '@apirtc/react-lib';

import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useThemeProps } from '@mui/material/styles';

import LogRocket from 'logrocket';

import { AppContext } from './AppContext';
import { Invitation } from './Invitation';
import { OutputMessageType } from './MessageTypes';
import { Room } from './Room';
import { Settings } from './Settings';
import { Timeline } from './Timeline';
import { TimelineContext } from './TimelineContext';
import { CODECS } from './constants';
import { getFromLocalStorage, setLocalStorage } from './local-storage';
import { TimelineEvent } from './types';

import inNotification from "./assets/mixkit-bubble-pop-up-alert-notification-2357.wav";
import offNotification from "./assets/mixkit-electric-pop-2365.wav";

const AUDIO_IN = new Audio(inNotification);
const AUDIO_OFF = new Audio(offNotification);

const CONVERSATION_OPTIONS = {
    // moderationEnabled: true, moderator: true,
    meshModeEnabled: true
};

enum MenuValues {
    Invite = 'invite',
    Settings = 'settings',
    Timeline = 'timeline'
}

export type AppProps = {
    invitationLabel?: string,
    timelineLabel?: string,
    settingsLabel?: string,
    contactJoined?: string,
    contactLeft?: string,
    noConversationText?: string
};
const COMPONENT_NAME = "App";
export function App(inProps: AppProps) {

    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const {
        invitationLabel = "Invite", timelineLabel = "Timeline", settingsLabel = "My settings",
        contactJoined = "joined conversation", contactLeft = "left",
        noConversationText = 'Session and Conversation name required'
    } = props;

    const { appConfig, userData,
        audio,
        connect, join, conversationName,
        notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const withAudioInitValue = useMemo(() => (/true/i).test(getFromLocalStorage(`${installationId}.withAudio`, 'true')),
        [installationId]);
    const { value: withAudio, toggle: toggleAudio } = useToggle(audio ? withAudioInitValue : false);
    const withVideoInitValue = useMemo(() => (/true/i).test(getFromLocalStorage(`${installationId}.withVideo`, 'true')),
        [installationId]);
    const { value: withVideo, toggle: toggleVideo } = useToggle(withVideoInitValue);
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
            },
            tryAudioOnlyAfterUserMediaError: true,
        }
    }, [withAudio, withVideo, selectedAudioInId, selectedVideoInId]);

    const cameraErrorCallback = useCallback((error: any) => {
        if (globalThis.logLevel.isWarnEnabled) {
            console.warn(`${COMPONENT_NAME}|useCameraStream error`, error);
        }
        notify({
            type: OutputMessageType.Error,
            reason: error.message
        })
    }, [notify]);

    const { stream: cameraStream, grabbing, error: grabError } = useCameraStream(
        (withAudio || withVideo) ? session : undefined,
        createStreamOptions, cameraErrorCallback);

    const { conversation, joined } = useConversation(session,
        conversationName,
        // no need for using useState nor useMemo as longs as the value is a constant
        CONVERSATION_OPTIONS,
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

    const { contacts } = useConversationContacts(conversation, onContactJoined, onContactLeft);

    const hasContacts = useMemo(() => contacts.length > 0, [contacts]);

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
        notify({
            type: OutputMessageType.Contacts,
            length: contacts.length,
        })
    }, [contacts, notify])

    useEffect(() => {
        if (hasContacts) {
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
    }, [hasContacts])

    useEffect(() => {
        // Notify parent resize might be necessary
        notify({
            type: OutputMessageType.Resize
        })
    }, [notify, cameraStream])

    useEffect(() => {
        if (cameraStream) {
            cameraStream.on('trackStopped', (event: any) => {
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
    }, [notify, cameraStream])

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

    useEffect(() => {
        setMenuValue((prev) => {
            // when some subscribed streams appear, clear the menu selection
            if (hasContacts) return undefined
            // when there are no more subscribed streams
            // If a menu is selected, keep this one
            if (prev) {
                return prev
            }
            // otherwise go to invite
            return MenuValues.Invite
        })
    }, [hasContacts])

    const _settingsErrors = useMemo(() => [
        ...(grabError ? [`Camera error : ${grabError.message}`] : []),
        ...(withAudio && !grabbing && cameraStream && !cameraStream.hasAudio() ? ["Failed to grab audio"] : []),
        ...(withVideo && !grabbing && cameraStream && !cameraStream.hasVideo() ? ["Failed to grab video: Please check a device is available and not already grabbed by another software"] : [])
    ], [cameraStream, grabbing, grabError, withAudio, withVideo]);

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
                return <Settings session={session}
                    settingsErrors={settingsErrors}
                    withAudio={withAudio} toggleAudio={toggleAudio}
                    withVideo={withVideo} toggleVideo={toggleVideo}
                    userMediaDevices={userMediaDevices}
                    selectedAudioIn={selectedAudioIn} setSelectedAudioIn={setSelectedAudioIn}
                    selectedVideoIn={selectedVideoIn} setSelectedVideoIn={setSelectedVideoIn}
                    grabbing={grabbing}
                    stream={cameraStream}></Settings>
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
                return <Timeline events={timelineEvents} />
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

        {menuValue && conversation && hasContacts && <Divider sx={{ m: 2 }} />}

        {conversation && hasContacts && <Room sx={{
            mt: 1, px: 1,
            minHeight: '100%', width: '100%',
        }}
            conversation={conversation}
            stream={cameraStream}
            onSnapshot={onSnapshot}
            onDisplayChange={() => {
                notify({
                    type: OutputMessageType.Resize
                })
            }}
        />}

    </TimelineContext.Provider>
}