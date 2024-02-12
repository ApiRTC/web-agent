import { AppProps } from "../App";
import { InvitationProps } from "../Invitation";
import { RoomProps } from "../Room";

export default interface Localization {
    components?: {
        App?: {
            defaultProps: Pick<AppProps,
                'blurLabel' | 'noiseReductionLabel' |
                'invitationLabel' | 'timelineLabel' | 'settingsLabel' |
                'audioOffTooltip' | 'audioOnTooltip' | 'videoOffTooltip' | 'videoOnTooltip' |
                // 'audioInLabel' | 'audioOutLabel' | 'videoInLabel' |
                // 'getConversationDurationComment' | 'getSnapshotComment'
                'contactJoined' | 'contactLeft' |
                'noEventsText' | 'noConversationText'
            >;
        };
        Invitation?: {
            defaultProps: Pick<InvitationProps, 'copyLinkText' | 'openLinkText' |
                'sendEmailText' | 'sentEmailText' | 'emailFailText' |
                'sendShortMsgText' | 'shortMsgSentText' | 'shortMsgFailText' |
                'commentFailText' |
                'facingModeText' | 'userFacingModeText' | 'environmentFacingModeText' |
                'namePlaceholder' | 'emailPlaceholder' | 'phonePlaceholder' |
                'getInviteComment' | 'getEmailSentComment' | 'getSmsSentComment' |
                'getEmailHtml' | 'getEmailText' | 'getSmsText'>;
        };
        Room?: {
            defaultProps: Pick<RoomProps, 'hangUpText' | 'shareScreenText'>;
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