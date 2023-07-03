import { AppProps } from "../App";
import { InvitationProps } from "../Invitation";
import { RoomProps } from "../Room";

export default interface Localization {
    components?: {
        App?: {
            defaultProps: Pick<AppProps, 'invitationLabel' | 'settingsLabel' |
                'audioOffTooltip' | 'audioOnTooltip' | 'videoOffTooltip' | 'videoOnTooltip'
            // 'audioInLabel' | 'audioOutLabel' | 'videoInLabel' |
            // 'getConversationDurationComment' | 'getSnapshotComment'
            >;
        };
        Invitation?: {
            defaultProps: Pick<InvitationProps, 'copyLinkText' |
                'sendEmailText' | 'sendSmsText' | 'sentEmailText' | 'sentSmsText' |
                'emailFailText' | 'smsFailText' |
                'commentFailText' |
                'facingModeText' | 'userFacingModeText' | 'environmentFacingModeText' |
                'namePlaceholder' | 'emailPlaceholder' | 'phonePlaceholder' |
                'getInviteComment' | 'getEmailSentComment' | 'getSmsSentComment' |
                'getEmailHtml' | 'getEmailText' | 'getSmsText'>;
        };
        Room?: {
            defaultProps: Pick<RoomProps, 'hangUpText'>;
        };
    };
}