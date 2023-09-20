export enum InputMessageType {
    Configuration = 'configuration',
    Connect = 'connect',
    Conversation = 'conversation',
    Disconnect = 'disconnect',
    GuestData = 'guest_data',
    JoinConversation = 'join_conversation',
    LeaveConversation = 'leave_conversation',
    UserData = 'user_data'
}

export enum OutputMessageType {
    LinkCopied = 'link_copied',
    Ready = 'ready',
    Resize = 'resize',
    Snapshot = 'snapshot',
    SubscribedStreams = 'subscribed_streams',
}