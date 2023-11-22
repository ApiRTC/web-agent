export enum InputMessageType {
    Configuration = 'configuration',
    Connect = 'connect',
    Conversation = 'conversation',
    Disconnect = 'disconnect',
    GuestData = 'guest_data',
    Join = 'join',
    Leave = 'leave',
    UserData = 'user_data'
}

export enum OutputMessageType {
    Error = 'error',
    Joined = 'joined',
    Left = 'left',
    LinkCopied = 'link_copied',
    Ready = 'ready',
    Resize = 'resize',
    SmsSent = 'sms_sent',
    SmsFail = 'sms_fail',
    Snapshot = 'snapshot',
    SubscribedStreams = 'subscribed_streams',
    Warning = 'warning'
}