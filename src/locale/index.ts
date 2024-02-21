import { AppProps } from "../App";
import { InvitationProps } from "../Invitation";
import { RoomProps } from "../Room";
import { SettingsProps } from "../Settings";
import { TimelineProps } from "../Timeline";

export default interface Localization {
    components?: {
        App?: {
            defaultProps: Pick<AppProps,
                'invitationLabel' | 'timelineLabel' | 'settingsLabel' |
                // 'audioInLabel' | 'audioOutLabel' | 'videoInLabel' |
                // 'getConversationDurationComment' | 'getSnapshotComment'
                'contactJoined' | 'contactLeft' |
                'noConversationText'
            >;
        };
        Invitation?: {
            defaultProps: Pick<InvitationProps, 'copyLinkText' | 'openLinkText' |
                'sendEmailText' | 'sentEmailText' | 'emailFailText' |
                'sendShortMsgText' | 'shortMsgSentText' | 'shortMsgFailText' |
                'commentFailText' |
                'facingModeText' | 'userFacingModeText' | 'environmentFacingModeText' |
                'namePlaceholder' | 'emailPlaceholder' | 'phonePlaceholder' |
                'avShareLabel' | 'screenShareLabel' |
                'getInviteComment' | 'getEmailSentComment' | 'getSmsSentComment' |
                'getEmailHtml' | 'getEmailText' | 'getSmsText'>;
        };
        Timeline?: {
            defaultProps: Pick<TimelineProps, 'noEventsText'>;
        };
        Room?: {
            defaultProps: Pick<RoomProps, 'hangUpText' | 'shareScreenText'>;
        };
        Settings?: {
            defaultProps: Pick<SettingsProps,
                'blurLabel' | 'noiseReductionLabel' | 'audioOffTooltip' | 'audioOnTooltip' | 'videoOffTooltip' | 'videoOnTooltip'>;
        };
    };
}

export const languageToLocale = (language: string) => {
    switch (language) {
        case 'fr':
        case 'fr-FR':
            return 'fr-FR'
        default:
            return 'en-US'
    }
};