export interface Notification {
    id: string;
    type: string;
    message: string;
    sender: {
        username: string;
        id: string;
    };
    eventId?: string;
    read: boolean;
    status: 'PENDING' | 'SENT';
    createdAt: string;
}

export interface NotificationResponse {
    message: string;
    modifiedCount?: number;
    deletedCount?: number;
}

export interface DashboardData {
    upcomingEvents: Event[];
    pastEvents: Event[];
    friends: string[];
    notifications: Notification[];
}

export interface Event {
    id: string;
    title: string;
    location: string;
    date: string;
    friends: string[];
}