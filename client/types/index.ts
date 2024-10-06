export interface NotificationSender {
    id: string;
    username: string;
    email: string;
    avatarUrl: string;
}

export interface Notification {
    id: string;
    type: 'NEW_FRIEND_REQUEST' | 'FRIEND_REQUEST_ACCEPTED' | 'FRIEND_REQUEST_REJECTED' | 'FRIEND_REQUEST_REMOVED' | 'EVENT_CREATED' | 'EVENT_INVITATION_ACCEPTED' | 'EVENT_INVITATION_DECLINED' | 'EVENT_UPDATED' | 'EVENT_CANCELLED';
    message: string;
    sender: NotificationSender;
    event?: {
        id: string;
        name: string;
        date: string;
        location: string;
    } | null;
    createdAt: Date;
    read: boolean;
    status: 'PENDING' | 'SENT';
}

export interface NotificationResponse {
    message: string;
    modifiedCount?: number;
    deletedCount?: number;
}

export interface Event {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: string[];
}

export interface DashboardData {
    upcomingEvents: Event[];
    pastEvents: Event[];
    friends: string[];
    notifications: Notification[];
}

// New Message interface
export interface Message {
    id: string;
    content: string;
    timestamp: Date;
    sender: {
        id: string;
        // username?: string;
        // avatarUrl?: string;
    };
}