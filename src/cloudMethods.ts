export type CloudAccountConfig = {
    cloudUrl: string,
    username: string,
    password: string
};

const g_token: Map<string, string> = new Map();

const getToken: any = async (client: any, config: CloudAccountConfig) => {
    const options = {
        url: `${config.cloudUrl}/api/token`, type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            grant_type: 'password',
            username: config.username,
            password: config.password
        })
    };
    return client.request(options).then((data: any) => {
        //if (globalThis.logLevel.isDebugEnabled) {
        console.log(`${config.cloudUrl}/api/token success`, data)
        //}
        g_token.set(JSON.stringify(config), data.access_token)
    }).catch((error: any) => {
        console.error('getToken error', error)
    })
};

export const sendEmail: any = async (client: any, config: CloudAccountConfig, email: string, name: string, html: string, text: string) => {
    const options = {
        url: `${config.cloudUrl}/api/send-email`, type: 'POST',
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${g_token.get(JSON.stringify(config))}`,
        },
        data: JSON.stringify({
            recipients: [{
                email: email,
                name: name
            }],
            subject: "Invitation ZenDesk z-visio",
            html_part: html,
            text_part: text,
        })
    };
    return client.request(options).then((data: any) => {
        //if (globalThis.logLevel.isDebugEnabled) {
        console.log(`${config.cloudUrl}/api/send-email success`, data)
        //}
        return data
    }).catch((error: any) => {
        if (error.status === 401) {
            return getToken(client, config).then(() => {
                return sendEmail(client, config, email, name, html, text)
            })
        } else {
            console.error(`${config.cloudUrl}/api/send-email error`, error)
        }
    })
};

export const sendSms: any = async (client: any, config: CloudAccountConfig, phoneNumbers: Array<string>, message: string) => {
    const options = {
        url: `${config.cloudUrl}/api/text-message`, type: 'POST',
        contentType: 'application/json',
        headers: {
            Authorization: `Bearer ${g_token.get(JSON.stringify(config))}`,
        },
        // TODO : need to somehow convert inviteLink with short url, such long links do not work on iPhones.
        data: JSON.stringify({
            to: phoneNumbers,
            body: message
            // works on iphone
            //https://apirtc.github.io/visio-assisted/eyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyua
            // DOES NOT WORK on iPhone:
            //https://apirtc.github.io/visio-assisted/eyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyuab
            // works on iphone
            //https://apirtc.github.io/visio-assisted/eyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyueyyhyhyhyua/b
            // so it seems path name length <=301 work, while more fails...
        })
    };
    return client.request(options).then((data: any) => {
        //console.log(`${config.cloudUrl}/api/text-message success`, data)
        return data
    }).catch((error: any) => {
        if (error.status === 401) {
            return getToken(client, config).then(() => {
                return sendSms(client, config, phoneNumbers, message)
            })
        } else {
            console.error(`${config.cloudUrl}/api/text-message error`, error)
        }
    })
};