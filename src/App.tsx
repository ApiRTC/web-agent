import { useCallback, useContext, useEffect, useMemo } from 'react';

import { Contact, RegisterInformation, UserData } from '@apirtc/apirtc';
import { Audio, MediaDeviceSelect, Stream, Video, useToggle } from '@apirtc/mui-react-lib';
import { Credentials, useCameraStream, useConversation, useSession, useUserMediaDevices } from '@apirtc/react-lib';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useThemeProps } from '@mui/material/styles';

import { AppContext } from './AppContext';
import { Invitation } from "./Invitation";
import { Room } from "./Room";
import { CODECS, RESIZE_CONTAINER_DELAY, VIDEO_ROUNDED_CORNERS } from './constants';

import { Tooltip } from '@mui/material';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { getFromLocalStorage, setLocalStorage } from './utils';

export type AppProps = {
    invitationLabel?: string,
    settingsLabel?: string,
    audioOffTooltip?: string,
    audioOnTooltip?: string,
    videoOffTooltip?: string,
    videoOnTooltip?: string,
    // audioInLabel?: string,
    // audioOutLabel?: string,
    // videoInLabel?: string,
    // getConversationDurationComment?: (h: number, m: number, s: number) => string,
    // getSnapshotComment?: (name: string) => string,
};
const COMPONENT_NAME = "App";
export function App(inProps: AppProps) {

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const { invitationLabel = "Invite", settingsLabel = "My settings",
        audioOffTooltip = "Audio Off", audioOnTooltip = "Audio On", videoOffTooltip = "Video Off", videoOnTooltip = "Video On",
        // audioInLabel = "Audio In", audioOutLabel = "Audio Out", videoInLabel = "Video In",
        // getConversationDurationComment = (h: number, m: number, s: number) => `Conversation duration ${hmsToEnglishString(h, m, s)}.`,
        // getSnapshotComment = (name: string) => `Snapshot from ${name}.`
    } = props;

    const { appConfig, userData, activated, conversationName, notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const { value: withAudio, toggle: toggleAudio } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.withAudio`, 'false')));
    const { value: withVideo, toggle: toggleVideo } = useToggle((/true/i).test(getFromLocalStorage(`${installationId}.withVideo`, 'false')));
    useEffect(() => {
        setLocalStorage(`${installationId}.withAudio`, `${withAudio}`)
        setLocalStorage(`${installationId}.withVideo`, `${withVideo}`)
    }, [installationId, withAudio, withVideo])

    const registerInformation: RegisterInformation = useMemo(() => {
        return {
            id: userData?.userId,
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

    const { session } = useSession(activated ? credentials : undefined,
        registerInformation,
        (error) => {
            console.error(`${COMPONENT_NAME}|useSession error`, error)
            //client.invoke('notify', `ApiRtc session failed`, 'error')
            notify('error', `ApiRtc session failed`)
        });

    const { userMediaDevices,
        selectedAudioIn, setSelectedAudioIn,
        selectedVideoIn, setSelectedVideoIn } = useUserMediaDevices(
            activated ? session : undefined,
            installationId);

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

    const { stream } = useCameraStream(activated
        && (withAudio || withVideo) ? session : undefined, {
        // BUG@apirtc: audioInputId and videoInputId actually modify the CreateStreamOptions (it is not immutable), so the options object change
        // and re-triggers rendering. To prevent this, build a constraints object using deviceId directly.
        //audioInputId: selectedAudioIn?.id,
        //videoInputId: selectedVideoIn?.id,
        constraints: constraints
    });

    const { conversation } = useConversation(session, conversationName,
        {
            meshModeEnabled: true
        },
        true,
        // TODO: supportedVideoCodecs is not yet documented nor exposed as a possible JoinOptions in apirtc typings
        // thus we need to add 'as any'
        { ...CODECS } as any);

    const doResize = () => {
        // It takes a few moments before DOM is actually updated
        // so we have to wait for streams full render before the resizeContainer
        // works with the actual required size.
        //resizeContainer(client, MAX_HEIGHT)

        // Notify iframe parent about resize
        window.parent.postMessage({
            type: 'resize'
        }, '*')

        return setTimeout(() => {
            //resizeContainer(client, MAX_HEIGHT)
        }, RESIZE_CONTAINER_DELAY);
    };

    useEffect(() => {
        const timeoutId = doResize();
        return () => {
            clearTimeout(timeoutId)
        }
    }, [stream]) // depends on what is rendered

    const onStart = useCallback(() => {
        window.parent.postMessage({
            type: 'conversation_start',
            conversationName: conversationName
        }, '*')
    }, [conversationName]);

    const onEnd = useCallback((durationMilliseconds: number) => {
        window.parent.postMessage({
            type: 'conversation_end',
            conversationName: conversationName,
            durationMilliseconds
        }, '*')
    }, [conversationName]);

    const onSnapshot = useCallback((contact: Contact, dataUrl: string) => {
        return new Promise<void>((resolve, reject) => {
            const message = {
                type: 'snapshot',
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

    return <>
        <Accordion onChange={doResize}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="settings-content"
                id="settings-header"
                data-testid="settings-btn">
                <Typography variant="h6">{settingsLabel}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack direction={{ xs: 'column', sm: 'row' }}
                    alignItems='center' justifyContent='center'
                    spacing={2}>
                    {stream && <Stream sx={{ maxWidth: '237px', maxHeight: '260px' }}
                        stream={stream} muted={true}>
                        {stream.hasVideo() ? <Video style={{ maxWidth: '100%', ...VIDEO_ROUNDED_CORNERS }}
                            data-testid={`video-${conversationName}`} /> : <Audio data-testid={`audio-${conversationName}`} />}
                    </Stream>}
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title={withAudio ? audioOnTooltip : audioOffTooltip}>
                                <IconButton data-testid='audio-btn'
                                    size='large'
                                    color='primary'
                                    onClick={toggleAudio}>{withAudio ? <Icon>mic</Icon> : <Icon>mic_off</Icon>}</IconButton>
                            </Tooltip>
                            {/* <FormControl fullWidth>
                                <InputLabel id='audio-in-label'>{audioInLabel}</InputLabel> */}
                            <MediaDeviceSelect sx={{ mt: 1, minWidth: '120px', maxWidth: '240px' }}
                                id='audio-in'
                                size='small'
                                // label={audioInLabel}
                                disabled={!withAudio}
                                devices={userMediaDevices.audioinput}
                                selectedDevice={selectedAudioIn}
                                setSelectedDevice={setSelectedAudioIn} />
                            {/* </FormControl> */}
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title={withVideo ? videoOnTooltip : videoOffTooltip}>
                                <IconButton data-testid='video-btn' color='primary' onClick={toggleVideo}>{withVideo ? <Icon>videocam</Icon> : <Icon>videocam_off</Icon>}</IconButton>
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
            </AccordionDetails>
        </Accordion>
        {conversationName && <Accordion onChange={doResize}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="invitation-content"
                id="invitation-header"
                data-testid="invitation-btn">
                <Typography variant="h6">{invitationLabel}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Invitation sx={{ mt: 1 }} conversationName={conversationName}></Invitation>
            </AccordionDetails>
        </Accordion>}
        <Divider />
        {
            conversation && <Room sx={{
                mt: 1, mr: '1',
                minHeight: '100%', width: '100%',
            }}
                conversation={conversation}
                stream={stream}
                onSnapshot={onSnapshot}
                onStart={onStart}
                onEnd={onEnd}
                onDisplayChange={doResize}
            />
        }
    </>
}