import { useContext } from "react";

import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from '@mui/material/Switch';
import Tooltip from "@mui/material/Tooltip";
import { ThemeProvider as MuiThemeProvider, createTheme, useThemeProps } from '@mui/material/styles';

import { Stream as ApiRTCStream, MediaDevice, MediaDeviceList, Session } from "@apirtc/apirtc";
import { Audio, MediaDeviceSelect, Stream, Video } from "@apirtc/mui-react-lib";

import { AppContext } from "./AppContext";
import { VIDEO_ROUNDED_CORNERS } from "./constants";

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

export type SettingsProps = {
    session: Session | undefined,
    settingsErrors: string[],
    withAudio: boolean, toggleAudio: () => void,
    withVideo: boolean, toggleVideo: () => void,
    blur: boolean, toggleBlur: () => void,
    noiseReduction: boolean, toggleNoiseReduction: () => void,
    userMediaDevices: MediaDeviceList,
    selectedAudioIn: MediaDevice | undefined, setSelectedAudioIn: Function,
    selectedVideoIn: MediaDevice | undefined, setSelectedVideoIn: Function,
    grabbing: boolean,
    stream: ApiRTCStream | undefined,
    blurLabel?: string,
    noiseReductionLabel?: string,
    audioOffTooltip?: string,
    audioOnTooltip?: string,
    videoOffTooltip?: string,
    videoOnTooltip?: string,
};

const COMPONENT_NAME = "Settings";
export function Settings(inProps: SettingsProps) {
    const props = useThemeProps({ props: inProps, name: COMPONENT_NAME });
    const {
        session,
        settingsErrors,
        withAudio, toggleAudio, withVideo, toggleVideo,
        blur, toggleBlur,
        noiseReduction, toggleNoiseReduction,
        userMediaDevices,
        selectedAudioIn, setSelectedAudioIn,
        selectedVideoIn, setSelectedVideoIn,
        grabbing,
        stream,
        blurLabel = "Blur", noiseReductionLabel = "Noise reduction",
        audioOffTooltip = "Audio Off", audioOnTooltip = "Audio On", videoOffTooltip = "Video Off", videoOnTooltip = "Video On",
    } = props;

    const { audio } = useContext(AppContext);

    return <MuiThemeProvider theme={SETTINGS_THEME}>
        <Stack direction="column" spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }}
                alignItems='center' justifyContent='center'
                spacing={2}>
                {grabbing && !stream && <Skeleton variant="rectangular" width={237} height={178} />}
                {stream && <Stream sx={{ maxWidth: '237px', maxHeight: '260px' }}
                    stream={stream} muted={true}>
                    {stream.hasVideo() ? <Video style={{ maxWidth: '100%', ...VIDEO_ROUNDED_CORNERS }}
                        data-testid='local-stream-video' /> : <Audio data-testid='local-stream-audio' />}
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
                        <FormControlLabel control={<Switch
                            checked={noiseReduction}
                            onChange={toggleNoiseReduction}
                            inputProps={{ 'aria-label': noiseReduction ? 'noise-reduction' : 'no-noise-reduction' }}
                        />} label={noiseReductionLabel} />
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
            {stream && stream.data && <div>{stream.data.id}</div>}
            {stream && <div>{stream.audioAppliedFilter}</div>}
            {stream && <div>{stream.videoAppliedFilter}</div>}
        </Stack>
    </MuiThemeProvider>
}