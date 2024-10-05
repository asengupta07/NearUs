import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    eventDate: {
        type: Date,
        required: true,
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    type: {
        type: String,
        enum: ['Upcoming', 'Past'],
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    maxAttendees: {
        type: Number,
        default: null
    },
    suggestedLocations: [{
        name: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    }],
}, { timestamps: true });

const UserFriendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted'],
        default: 'Accepted'
    }
}, { timestamps: true });

const UserEventSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['Invited', 'Going', 'Not Going'],
        default: 'Going'
    },
    flexibility: {
        type: Number,
        default: 5,
        min: 0,
        max: 50
    },
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'FRIEND_REQUEST_ACCEPTED',
        'FRIEND_REQUEST_REJECTED',
        'NEW_FRIEND_REQUEST',
        'EVENT_CREATED',
        'EVENT_INVITATION_ACCEPTED',
        'EVENT_INVITATION_DECLINED',
        'EVENT_UPDATED',
        'EVENT_CANCELLED'
      ],
      required: true
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    status: { type: String, enum: ['PENDING', 'SENT'], default: 'PENDING' },
    createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ location: '2dsphere' });
UserSchema.index({ username: 'text', email: 'text' });
UserSchema.index({ email: 1, username: 1 });

NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export {
    UserSchema,
    EventSchema,
    UserFriendSchema,
    UserEventSchema,
    NotificationSchema,
    User,
    Event,
    UserFriend,
    UserEvent,
    Notification
};