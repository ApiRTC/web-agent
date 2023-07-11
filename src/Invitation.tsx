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

import { GetOrCreateConversationOptions, JoinOptions, PublishOptions } from '@apirtc/apirtc';
import { PublishOptions as PublishOptionsComponent, useToggleArray } from '@apirtc/mui-react-lib';

import { AppContext } from './AppContext';
import { CODECS } from './constants';
import { getFromLocalStorage, setLocalStorage } from './utils';

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

const storageToPublishOptions = (installationId: string): PublishOptions => {
    const buffer = getFromLocalStorage(`${installationId}.publishOptions`, null);
    if (buffer) {
        return JSON.parse(buffer) as PublishOptions;
    } else {
        return {}
    }
};

export type InvitationProps = {
    sx?: SxProps,
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
    const { moderationEnabledText = "Moderated",
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

    const [name, setName] = useState<string>(inviteeData?.name || EMPTY_STRING);
    const [email, setEmail] = useState<string>(EMPTY_STRING);
    const [phone, setPhone] = useState<string>(EMPTY_STRING);
    const [publishOptions, setPublishOptions] = useState<PublishOptions>(storageToPublishOptions(installationId));
    const { value: facingMode, index: facingModeIndex,
        setIndex: setFacingModeIndex } = useToggleArray(FACING_MODES, FACING_MODES.indexOf(getFromLocalStorage(`${installationId}.facingMode`, FACING_MODES[0])));

    const [sending, setSending] = useState<boolean>(false);

    useEffect(() => {
        if (inviteeData?.name) {
            setName(inviteeData.name)
        }
    }, [inviteeData])

    useEffect(() => {
        setLocalStorage(`${installationId}.publishOptions`, JSON.stringify(publishOptions));
        setLocalStorage(`${installationId}.facingMode`, facingMode);
    }, [installationId, publishOptions, facingMode])

    const invitationLink = useMemo(() => {
        const invitationData: InvitationData | undefined = name && name !== EMPTY_STRING ? {
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
                firstName: name,
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
        return invitationData ? encodeURI(appConfig.assistedUrl + '?i=' + base64_encode(JSON.stringify(invitationData))) : undefined
    }, [appConfig, props.conversationName, name, publishOptions, facingMode]);

    const doCopyLink = useCallback(() => {
        if (invitationLink) {
            // Copy to clipboard
            navigator.clipboard.writeText(invitationLink);

            // Notify
            window.parent.postMessage({
                type: 'link_copied',
                name: name,
                link: invitationLink
            }, '*')
        }
    }, [name, invitationLink]);

    // const handleModerationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     props.setModerationEnabled(event.target.checked)
    // };

    const handleFacingModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFacingModeIndex(+(event.target as HTMLInputElement).value)
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
                <Input data-testid="name-input" placeholder={namePlaceholder} value={name} onChange={e => setName(e.target.value)} />
                {invitationLink && <Link href={invitationLink}>Link</Link>}
                {invitationLink && <Button variant='outlined' data-testid="copy-link-btn" onClick={doCopyLink}>{copyLinkText}</Button>}
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

