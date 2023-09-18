# Apizee web-agent web application

This **web-agent web application** is intended to be integrated within any third party web application through an i-frame.

## Getting started

The application is hosted [here](https://kmoyse-apizee.github.io/web-agent/). As is, it does not much. Some url parameters must be set to control it.

A mandatory one, **Ak** : is the **apiKey**, which you can get from [ApiRtc](https://apirtc.com).

Then **cN** specifies the **Conversation** **name**.

So specifying [?aK=myDemoApiKey&cN=Test](https://kmoyse-apizee.github.io/web-agent?aK=myDemoApiKey&cN=Test) shall work better.

**Note** : *myDemoApiKey* shall be used for this demo only, and may not allow to use all features (such as short-messages invitation for example).

## Integrate as iframe

To integrate the application with html through iframe you should do something like :

```html
<iframe src="https://kmoyse-apizee.github.io/web-agent?aK=myDemoApiKeycN=Test"
    height="720px" width="100%" frameborder="0"
    referrerpolicy="no-referrer"
    sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin allow-downloads"
    allow="geolocation;autoplay;microphone;camera;display-capture;midi;encrypted-media;clipboard-write;"></iframe>
```

## Url parameters

| Parameter | stand for            | Description                                                                |
| --------- | -------------------- | -------------------------------------------------------------------------- |
| aK        | apiKey               | your [ApiRtc](https://apirtc.com) **apiKey**, mandatory                    |
| aU        | assistedUrl          | url of the web-assisted web application                                    |
| cN        | conversationName     | the **ApiRtc** **Conversation** name                                       |
| cU        | cloudUrl             | the cloud url, defaults to https://cloud.apirtc.com                        |
| iI        | installationId       | used a header for local-storage keys                                       |
| iN        | inviteeName          | name to be pre-set in the invitation form                                  |
| iU        | invitationServiceUrl | url of the invitation service                                              |
| l         | locale               | to force locale to fr or en                                                |
| lL        | logLevel             | can be debug, info, warn, error                                            |
| uId       | userId               | id of the user-agent that the application will use to connect with **ApiRtc** |

All parameters are optional, except **aK**.

## Dynamic control

When using an iframe url parameters are set only once. To enable real-time interaction, the web-agent application listens to messages.

Using the [Window: postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) method, the host application can control web-agent application behavior.

To post a message, get a handle on the iframe and 


