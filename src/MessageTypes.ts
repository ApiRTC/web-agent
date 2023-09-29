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
    LinkCopied = 'link_copied',
    Ready = 'ready',
    Resize = 'resize',
    Snapshot = 'snapshot',
    SubscribedStreams = 'subscribed_streams',
}