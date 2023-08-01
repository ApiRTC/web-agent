import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SxProps, useThemeProps } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Input from '@mui/material/Input';
import Link from '@mui/material/Link';
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

// declare var apiRTC: any;

// WARN : to be kept in sync with visio-assisted / z-visio code
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
        constraints?: MediaStreamConstraints,
        publishOptions?: PublishOptions
    }>
};

const EMPTY_STRING = '';
const FACING_MODES = ['user', 'environment'];

// declare var apiRTC: any;

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

    const { appConfig, inviteeData, notify } = useContext(AppContext);

    const installationId = appConfig.installationId;

    const props = useThemeProps({ props: inProps, name: `${COMPONENT_NAME}` });
    const {
        session,
        moderationEnabledText = "Moderated",
        sendEmailText = "Send e-mail",
        sentEmailText = "E-mail sent",
        emailFailText = "Failed to send e-mail",
        sendSmsText = "Send text",
        sentSmsText = "Sms sent",
        smsFailText = "Failed to send sms",
        commentFailText = "Failed add comment",
        copyLinkText = "Copy Link",
        facingModeText = "Facing mode",
        userFacingModeText = "user", environmentFacingModeText = "environment",
        namePlaceholder = "Name",
        emailPlaceholder = "Email",
        phonePlaceholder = "Phone",
        getInviteComment = (name: string, link: string) => `Hello ${name},
I would like to invite you to a visio call, please click this <a href='${link}'>link</a> to join.`,
        getEmailSentComment = (to: string) => `An e-mail was sent to ${to}`,
        getSmsSentComment = (to: string) => `A short-message was sent to ${to}`,
        getEmailHtml = (name: string, link: string) => `Hello ${name},
I would like to invite you to a visio call, please click this <a href='${link}'>link</a> to join.`,
        getEmailText = (name: string, link: string) => `Hello ${name},
I would like to invite you to a visio call, please click ${link} to join.`,
        getSmsText = (name: string, link: string) => `Hello ${name},
Please join at ${link}.
Thanks` } = props;

    // name to handle typing
    const [name, setName] = useState<string>(inviteeData?.name || EMPTY_STRING);
    // inviteeName is the debounced name
    const [inviteeName, setInviteeName] = useState<string>(inviteeData?.name || EMPTY_STRING);
    const [email, setEmail] = useState<string>(EMPTY_STRING);
    const [phone, setPhone] = useState<string>(EMPTY_STRING);
    const [publishOptions, setPublishOptions] = useState<PublishOptions>(storageToPublishOptions(`${installationId}.invitee.publishOptions`));
    const { value: facingMode, index: facingModeIndex,
        setIndex: setFacingModeIndex } = useToggleArray(FACING_MODES,
            FACING_MODES.indexOf(getFromLocalStorage(`${installationId}.invitee.facingMode`, FACING_MODES[0])));

    const [sending, setSending] = useState<boolean>(false);

    const [invitationShortLink, setInvitationShortLink] = useState<string>();

    useEffect(() => {
        if (inviteeData?.name) {
            setName(inviteeData.name)
            setInviteeName(inviteeData.name)
        }
    }, [inviteeData])

    useEffect(() => {
        setLocalStorage(`${installationId}.invitee.publishOptions`, JSON.stringify(publishOptions));
        setLocalStorage(`${installationId}.invitee.facingMode`, facingMode ?? FACING_MODES[0]);
    }, [installationId, publishOptions, facingMode])

    const invitationData: InvitationData | undefined = useMemo(() => {
        return inviteeName && inviteeName !== EMPTY_STRING ? {
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
                firstName: inviteeName,
                lastName: ""
            },
            streams: [{
                constraints: {
                    audio: publishOptions.videoOnly ? false : {
                        echoCancellation: true,
                        noiseSuppression: true,
                    },
                    video: publishOptions.audioOnly ? false : {
                        advanced: [{ facingMode: facingMode }] // 'environment' or 'user'
                    }
                },
                publishOptions: publishOptions
            }]
        } : undefined;
    }, [appConfig, props.conversationName, inviteeName, facingMode, publishOptions]);

    const invitationLink = useMemo(() => {
        return invitationData ? encodeURI(appConfig.assistedUrl + '?i=' + base64_encode(JSON.stringify(invitationData))) : undefined
    }, [appConfig, invitationData]);

    useEffect(() => {
        if (globalThis.logLevel.isInfoEnabled) {
            console.info(`${COMPONENT_NAME}|useEffect invitationData`, invitationData)
        }
        if (invitationData) {
            fetch(`http://localhost:3007/invitations`,
                {
                    method: 'POST',
                    headers: {
                        // Authorization: `Bearer ${apiRTC.session.JWTApzToken}`,
                        Authorization: `Bearer ${(session as any).JWTApzToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: invitationData }),
                }).then(response => {
                    if (response.status === 200 || response.status === 201) {
                        return response.json()
                    }
                    console.error(`${COMPONENT_NAME}|fetch response in error`, response)
                    notify('error', `Failed to create short link: received ${response.status}`)
                }).then((data) => {
                    console.log(`${COMPONENT_NAME}|received invitation`, data)
                    setInvitationShortLink(appConfig.assistedUrl + '?i=' + data._id)
                })
                .catch((error) => {
                    console.error(`${COMPONENT_NAME}|fetch error`, error)
                })
            return () => {
                setInvitationShortLink(undefined)
            }
        }
    }, [appConfig, session, invitationData])

    const doCopyLink = useCallback(() => {
        if (invitationShortLink) {
            // Copy to clipboard
            navigator.clipboard.writeText(invitationShortLink);

            // Notify
            window.parent.postMessage({
                type: 'link_copied',
                name: inviteeName,
                link: invitationShortLink
            }, '*')
        }
    }, [inviteeName, invitationShortLink]);

    // const handleModerationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     props.setModerationEnabled(event.target.checked)
    // };

    const handleFacingModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFacingModeIndex(+(event.target as HTMLInputElement).value)
    };

    // Debouncing inviteeName is important to reduce the number of calls to invitation-service.
    // Without debounce the link creation is called for every key stroke.
    // Use memoized debounce with useCallback.
    // Without useCallback the debounce function would not sync with the next key stroke.
    const debouncedSetInviteeName = useCallback(debounce(setInviteeName, 500), []);
    // Clean it up when component unmounts
    useEffect(() => {
        return () => {
            debouncedSetInviteeName.cancel();
        };
    }, [debouncedSetInviteeName]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault()
        // set name so that what is typed is rendered immediately
        setName(event.target.value)
        // if something is typed the current link must be invalidated
        setInviteeName(EMPTY_STRING)
        // Finally manage inviteeName setting through debounce.
        debouncedSetInviteeName(event.target.value)
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
                <PublishOptionsComponent value={publishOptions} onChange={setPublishOptions} />
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
                {invitationLink && <Link href={invitationLink} target="_blank" rel="noopener">Link</Link>}
                {invitationShortLink && <Link href={invitationShortLink} target="_blank" rel="noopener">Link</Link>}
                {invitationShortLink && <Button variant='outlined' data-testid="copy-link-btn" onClick={doCopyLink}>{copyLinkText}</Button>}
            </Stack>
            {/* <Link href={inviteLink}>Lien pour {name}</Link> */}
            {/* <Stack sx={{ mt: 1 }}
                direction="row" spacing={1}>
                <Input data-testid="email-input" placeholder={emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />
                <Button sx={{ minWidth: 120 }} variant='outlined' disabled={sending} onClick={doSendEmail}>{sendEmailText}</Button>
            </Stack>
            <Stack sx={{ mt: 1 }}
                direction="row" spacing={1}>
                <Input data-testid="phone-input" placeholder={phonePlaceholder} value={phone} onChange={e => setPhone(e.target.value)} />
                <Button sx={{ minWidth: 120 }} variant='outlined' disabled={sending} onClick={doSendSms}>{sendSmsText}</Button>
            </Stack> */}
        </form>
    </Box>
}

