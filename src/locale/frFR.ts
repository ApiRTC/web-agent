import Localization from '.'

// const hmsToString = (h: number, m: number, s: number) => {
//     const hDisplay = h > 0 ? h + (h === 1 ? " heure, " : " heures, ") : "";
//     const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
//     const sDisplay = s > 0 ? s + (s === 1 ? " seconde" : " secondes") : "";
//     return `${hDisplay}${mDisplay}${sDisplay}`;
// };

export const frFR: Localization = {
    components: {
        App: {
            defaultProps: {
                invitationLabel: "Invitation",
                timelineLabel: "Evènements",
                settingsLabel: "Paramètres",
                // audioInLabel: "Entrée audio", audioOutLabel: "Sortie audio", videoInLabel: "Entrée vidéo",
                // getConversationDurationComment: (h: number, m: number, s: number) => `La conversation a duré ${hmsToString(h, m, s)}.`,
                // getSnapshotComment: (name: string) => `Photo de ${name}.`
                contactJoined: "a rejoint la conversation", contactLeft: "est parti",
                noConversationText: "Session et Conversation requises"
            }
        },
        Invitation: {
            defaultProps: {
                copyLinkText: `Copier`,
                openLinkText: 'Ouvrir',
                sendEmailText: "Envoyer",
                sendShortMsgText: "Envoyer",
                sentEmailText: "E-mel envoyé",
                shortMsgSentText: "Sms envoyé",
                emailFailText: "E-mel non envoyé", shortMsgFailText: "Sms non envoyé",
                commentFailText: "Commentaire non ajouté",
                facingModeText: "Caméra",
                userFacingModeText: "avant",
                environmentFacingModeText: "arrière",
                namePlaceholder: "Nom",
                emailPlaceholder: "e-mail",
                phonePlaceholder: "Téléphone",
                getInviteComment: (name: string, link: string) => `Bonjour ${name},
Je vous invite en visio, merci de cliquer <a href='${link}'>ici</a> pour me rejoindre.`,
                getEmailSentComment: (to: string) => `Un mél a été envoyé à ${to}.`,
                getSmsSentComment: (to: string) => `Un sms a été envoyé à ${to}.`,

                getEmailHtml: (name: string, link: string) => `Bonjour ${name},
Je vous invite en visio, merci de cliquer <a href='${link}'>ici</a> pour me rejoindre.`,
                getEmailText: (name: string, link: string) => `Bonjour ${name},
Je vous invite en visio, pour rejoindre : ${link}`,
                // WARNING: do not put a character like '.' close to ${link} because it breaks the hyperlink
                getSmsText: (name: string, link: string) => `Bonjour ${name},
Je vous invite en visio, pour rejoindre : ${link}`,
                // WARNING: do not put a character like '.' close to ${link} because it breaks the hyperlink
            }
        },
        Timeline: {
            defaultProps: {
                noEventsText: "pas d'évènements",
            }
        },
        Room: {
            defaultProps: {
                hangUpText: "Raccrocher",
                shareScreenText: "Partage écran"
            }
        },
        Settings: {
            defaultProps: {
                blurLabel: "Flou",
                noiseReductionLabel: "Réduction de bruit",
                audioOffTooltip: "Sans audio", audioOnTooltip: "Avec audio", videoOffTooltip: "Sans vidéo", videoOnTooltip: "Avec vidéo",
            }
        },
    }
};