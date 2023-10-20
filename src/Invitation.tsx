import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import SendIcon from '@mui/icons-material/Send';
import { ButtonGroup, SxProps, useThemeProps } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Input from '@mui/material/Input';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';

import { encode as base64_encode } from 'base-64';
import debounce from 'lodash.debounce';

import { GetOrCreateConversationOptions, JoinOptions, PublishOptions, Session } from '@apirtc/apirtc';
import { PublishOptions as PublishOptionsComponent, useToggleArray } from '@apirtc/mui-react-lib';

import { AppContext } from './AppContext';
import { CODECS } from './constants';
import { getFromLocalStorage, setLocalStorage } from './local-storage';
import { OutputMessageType } from './MessageTypes';

declare var apiRTC: any;

// WARN : to be kept in sync with web-guest / z-visio code
//
type InvitationData = {
    cloudUrl?: string
    apiKey?: string
    conversation: {
        name: string, friendlyName?: string,
        //moderationEnabled?: boolean
        getOrCreateOptions?: GetOrCreateConversationOptions,
        joinOptions?: JoinOptions
    }
    user: {
        firstName: string, lastName: string
    }
    streams: Array<{
        type: 'user-media' | 'display-media',
        constraints?: MediaStreamConstraints,
        publishOptions?: PublishOptions
    }>
};

const EMPTY_STRING = '';
const FACING_MODES = ['user', 'environment'];

const storageToPublishOptions = (key: string): PublishOptions => {
    const buffer = getFromLocalStorage(key, null);
    if (buffer) {
        return JSON.parse(buffer) as PublishOptions;
    } else {
        return {}
    }
};

export type InvitationProps = {
    sx?: SxProps,
    session: Session,
    conversationName: string,
    moderationEnabledText?: string,
    copyLinkText?: string,
    openLinkText?: string,
    sendEmailText?: string,
    sentEmailText?: string,
    emailFailText?: string,
    sendSmsText?: string,
    sentSmsText?: string,
    smsFailText?: string,
    commentFailText?: string,
    facingModeText?: string,
    userFacingModeText?: string,
    environmentFacingModeText?: string,
    namePlaceholder?: string,
    emailPlaceholder?: string,
    phonePlaceholder?: string,

    /**
      * Accepts a function which returns a string value that provides a user-friendly comment for the invitation.
      * @param {string} name The name of person to invite.
      * @param {string} link The invitation link.
      * @returns {string}
      */
    getInviteComment?: (name: string, link: string) => string,
    getEmailSentComment?: (to: string) => string,
    getSmsSentComment?: (to: string) => string,
    getEmailHtml?: (name: string, link: string) => string,
    getEmailText?: (name: string, link: string) => string,
    getSmsText?: (name: string, link: string) => string,
};
const COMPONENT_NAME = "Invitation";
export function Invitation(inProps: InvitationProps) {

    const { appConfig, allowAudio, guestData, notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const {
        // session,
        // moderationEnabledText = "Moderated",
        // sendEmailText = "Send e-mail",
        // sentEmailText = "E-mail sent",
        // emailFailText = "Failed to send e-mail",
        sendSmsText = "Send",
        sentSmsText = "Sms sent",
        smsFailText = "Failed to send sms",
        // commentFailText = "Failed add comment",
        copyLinkText = "Copy",
        openLinkText = "Open",
        facingModeText = "Facing mode",
        userFacingModeText = "user", environmentFacingModeText = "environment",
        namePlaceholder = "Name",
        // emailPlaceholder = "Email",
        phonePlaceholder = "Phone",
        //         getInviteComment = (name: string, link: string) => `Hello ${name},
        // I would like to invite you to a visio call, please click this <a href='${link}'>link</a> to join.`,
        // getEmailSentComment = (to: string) => `An e-mail was sent to ${to}`,
        getSmsSentComment = (to: string) => `A short-message was sent to ${to}`,
        //         getEmailHtml = (name: string, link: string) => `Hello ${name},
        // I would like to invite you to a visio call, please click this <a href='${link}'>link</a> to join.`,
        //         getEmailText = (name: string, link: string) => `Hello ${name},
        // I would like to invite you to a visio call, please click ${link} to join.`,
        // WARNING: do not put a character like '.' close to ${link} because it sometimes breaks the hyperlink (depending on devices)
        getSmsText = (name: string, link: string) => `Hello ${name},
Please join at ${link}
Thanks`
    } = props;

    // name to handle typing
    const [name, setName] = useState<string>(guestData?.name || EMPTY_STRING);
    // guestName is the debounced name
    const [guestName, setGuestName] = useState<string>(guestData?.name || EMPTY_STRING);
    // const [email, setEmail] = useState<string>(EMPTY_STRING);
    const [phone, setPhone] = useState<string>(guestData?.phone || EMPTY_STRING);
    const [publishOptions, setPublishOptions] = useState<PublishOptions>(allowAudio ? storageToPublishOptions(`${installationId}.guest.publishOptions`) : { videoOnly: true });
    const { value: facingMode, index: facingModeIndex,
        setIndex: setFacingModeIndex } = useToggleArray(FACING_MODES,
            FACING_MODES.indexOf(getFromLocalStorage(`${installationId}.guest.facingMode`, FACING_MODES[0])));

    const [invitationLink, setInvitationLink] = useState<string>();

    const [sending, setSending] = useState<boolean>(false);

    useEffect(() => {
        if (guestData?.name) {
            setName(guestData.name)
            setGuestName(guestData.name)
        }
        if (guestData?.phone) {
            setPhone(guestData.phone)
        }
    }, [guestData])

    useEffect(() => {
        setLocalStorage(`${installationId}.guest.publishOptions`, JSON.stringify(publishOptions));
        setLocalStorage(`${installationId}.guest.facingMode`, facingMode ?? FACING_MODES[0]);
    }, [installationId, publishOptions, facingMode])

    const invitationData: InvitationData | undefined = useMemo(() => {
        return guestName && guestName !== EMPTY_STRING ? {
            cloudUrl: appConfig.apiRtc.cloudUrl,
            apiKey: appConfig.apiRtc.apiKey,
            conversation: {
                name: props.conversationName,
                friendlyName: props.conversationName,
                getOrCreateOptions: {
                    moderationEnabled: false,
                    meshModeEnabled: true
                },
                joinOptions: { ...CODECS } as any // 'as any' because supportedVideoCodecs is not in apirtc typings
            },
            user: {
                firstName: guestName,
                lastName: "",
            },
            streams: [
                {
                    type: 'user-media',
                    constraints: {
                        audio: publishOptions.videoOnly ? false : {
                            echoCancellation: true,
                            noiseSuppression: true,
                        },
                        video: publishOptions.audioOnly ? false : {
                            facingMode: facingMode,
                            // advanced: [{ facingMode: facingMode }] // 'environment' or 'user'
                        }
                    },
                    publishOptions: publishOptions
                },
                // {
                //     type: 'display-media'
                // }
            ]
        } : undefined;
    }, [appConfig, props.conversationName, guestName, facingMode, publishOptions]);

    useEffect(() => {
        if (globalThis.logLevel.isDebugEnabled) {
            console.debug(`${COMPONENT_NAME}|useEffect invitationData`, invitationData)
        }
        if (invitationData) {
            fetch(appConfig.invitationServiceUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiRTC.session.JWTApzToken}`,
                    // Authorization: `Bearer ${(session as any).JWTApzToken}`, TODO: does not work : why JWTApzToken is not on the Session object returned by useSession ?
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: invitationData }),
            }).then(response => {
                if (response.ok) {
                    return response.json()
                }
                throw new Error(response.statusText);
            }).then((body) => {
                if (globalThis.logLevel.isDebugEnabled) {
                    console.debug(`${COMPONENT_NAME}|received invitation`, body)
                }
                setInvitationLink(appConfig.guestUrl + '?i=' + body.id)
            }).catch((error) => {
                notify('error', `Failed to create short link: received ${error}`)
                if (globalThis.logLevel.isWarnEnabled) {
                    console.warn(`${COMPONENT_NAME}|failed to get short link, using long instead`, error)
                }
                setInvitationLink(encodeURI(appConfig.guestUrl + '?i=' + base64_encode(JSON.stringify(invitationData))))
            })
            return () => {
                setInvitationLink(undefined)
            }
        }
    }, [appConfig, invitationData, notify]) //session

    const doCopyLink = useCallback(() => {
        if (invitationLink) {
            // Copy to clipboard
            navigator.clipboard.writeText(invitationLink);

            // Notify
            window.parent.postMessage({
                type: OutputMessageType.LinkCopied,
                name: guestName,
                link: invitationLink
            }, '*')
        }
    }, [guestName, invitationLink]);

    // Using ApiRTC cloud authenticated api
    const doSendSms = useCallback(() => {

        const link = invitationLink;

        if (phone !== "" && link) {
            const url = `${appConfig.apiRtc.cloudUrl ?? 'https://cloud.apirtc.com'}/api/text-message`;
            setSending(true)
            // client.request(options).then((data: any) => {
            //     client.invoke('notify', sentSmsText, 'notice');
            //     doComment(getSmsSentComment(phone))
            // })
            fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiRTC.session.JWTApzToken}`,
                    // Authorization: `Bearer ${(session as any).JWTApzToken}`, TODO: does not work : why JWTApzToken is not on the Session object returned by useSession ?
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: [phone],
                    body: getSmsText(name, link)
                }),
            }).then(response => {
                if (response.ok) {
                    return response.json()
                }
                throw new Error(response.statusText);
            }).then((body) => {
                if (globalThis.logLevel.isInfoEnabled) {
                    console.info(`${COMPONENT_NAME}|sms sent`, sentSmsText, getSmsSentComment(phone))
                }
                // Notify
                window.parent.postMessage({
                    type: OutputMessageType.SmsSent,
                    name: name,
                    phone: phone,
                    link: link
                }, '*')
            }).catch((error) => {
                if (globalThis.logLevel.isWarnEnabled) {
                    console.error(`${COMPONENT_NAME}|send sms failed`, smsFailText, error)
                }
                // Notify
                window.parent.postMessage({
                    type: OutputMessageType.SmsFail,
                    name: name,
                    phone: phone,
                    link: link
                }, '*')
            }).finally(() => {
                setSending(false)
            })

        }
    }, [appConfig, phone, name, invitationLink, sentSmsText, smsFailText, getSmsText, getSmsSentComment]);

    // const handleModerationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     props.setModerationEnabled(event.target.checked)
    // };

    const handleFacingModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFacingModeIndex(+(event.target as HTMLInputElement).value)
    };

    // Debouncing guestName is important to reduce the number of calls to invitation-service.
    // Without debounce the link creation is called for every key stroke.
    // Use memoized debounce with useCallback.
    // Without useCallback the debounce function would not sync with the next key stroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetGuestName = useCallback(debounce(setGuestName, 500), []);
    // Clean it up when component unmounts
    useEffect(() => {
        return () => {
            debouncedSetGuestName.cancel();
        };
    }, [debouncedSetGuestName]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        // set name so that what is typed is rendered immediately
        setName(event.target.value)
        // if something is typed the current link must be invalidated
        setGuestName(EMPTY_STRING)
        // Finally manage guestName setting through debounce.
        debouncedSetGuestName(event.target.value)
    };

    return <Box sx={props.sx}>
        <form>
            <Stack direction="row" spacing={2}>
                {/* <FormControlLabel control={<Switch
                    checked={props.moderationEnabled}
                    onChange={handleModerationChange}
                />} label={moderationEnabledText} />
                <Divider orientation="vertical" flexItem>
                </Divider> */}
                <PublishOptionsComponent value={publishOptions}
                    audioAndVideoOption={allowAudio}
                    audioOnlyOption={allowAudio}
                    onChange={setPublishOptions} />
                <Divider orientation="vertical" flexItem>
                </Divider>
                <FormControl disabled={publishOptions.audioOnly === true}>
                    <FormLabel data-testid="facing-mode-label">{facingModeText}</FormLabel>
                    <RadioGroup
                        aria-labelledby="publish-options"
                        name="publish-options"
                        value={String(facingModeIndex)}
                        onChange={handleFacingModeChange}>
                        <FormControlLabel id="user-facing-mode" value="0" control={<Radio size="small" />} label={userFacingModeText} />
                        <FormControlLabel id="env-facing-mode" value="1" control={<Radio size="small" />} label={environmentFacingModeText} />
                    </RadioGroup>
                </FormControl>
            </Stack>
            <Stack sx={{ mt: 1 }}
                direction="row" spacing={1}
                alignItems="flex-end">
                <Input data-testid="name-input" placeholder={namePlaceholder} value={name} onChange={handleNameChange} />
                <ButtonGroup variant="outlined" size="small">
                    {/* See issue https://github.com/mui/material-ui/issues/39287 : I had to make sure href is not undefined to make the statement accepted by typescript compiler */}
                    <Button data-testid="open-link-btn" disabled={!invitationLink} href={invitationLink ?? "#"} target="_blank" rel="noopener" startIcon={<LinkIcon />}>{openLinkText}</Button>
                    <Button data-testid="copy-link-btn" disabled={!invitationLink} onClick={doCopyLink} startIcon={<ContentCopyIcon />}>{copyLinkText}</Button>
                </ButtonGroup>
            </Stack>
            {/* <Link href={inviteLink}>Lien pour {name}</Link> */}
            {/* <Stack sx={{ mt: 1 }}
                direction="row" spacing={1}>
                <Input data-testid="email-input" placeholder={emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />
                <Button sx={{ minWidth: 120 }} variant='outlined' disabled={sending} onClick={doSendEmail}>{sendEmailText}</Button>
            </Stack>*/}
            <Stack sx={{ mt: 1 }}
                direction="row" spacing={1}>
                <Input data-testid="phone-input" size="small" placeholder={phonePlaceholder}
                    type='tel'
                    value={phone} onChange={e => setPhone(e.target.value)} />
                <Button sx={{ minWidth: 120 }} variant='outlined' size="small" disabled={!name || !phone || sending} onClick={doSendSms} startIcon={<SendIcon />}>{sendSmsText}</Button>
            </Stack>
        </form>
    </Box >
}

