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

const OpeningHoursSchema = new mongoose.Schema({
    open_now: Boolean,
    weekday_text: [String]
}, { _id: false });


const SuggestedLocationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    place_id: {
        type: String,
        required: true
    },
    formatted_address: {
        type: String,
        required: true
    },
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
    },
    rating: {
        type: String,
    },
    user_ratings_total: {
        type: String,
        default: '0'
    },
    types: [{
        type: String
    }],
    website: String,
    formatted_phone_number: String,
    price_level: {
        type: String,
    },
    opening_hours: OpeningHoursSchema,
    suggested_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    votes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        vote: {
            type: String,
            enum: ['up', 'down']
        }
    }]
}, { timestamps: true, _id: false });

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
    suggestedLocations: [SuggestedLocationSchema],
    finalLocation: {
        type: SuggestedLocationSchema,
        default: null
    }
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

const ChatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

ChatMessageSchema.index({ sender: 1, recipient: 1 });
ChatMessageSchema.index({ timestamp: -1 });

const InviteSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date }
}, { timestamps: true });

const Invite = mongoose.models.Invite || mongoose.model('Invite', InviteSchema);

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'FRIEND_REQUEST_ACCEPTED',
        'FRIEND_REQUEST_REJECTED',
        'NEW_FRIEND_REQUEST',
        'FRIEND_REMOVED', 
        'EVENT_CREATED',
        'EVENT_INVITATION_ACCEPTED',
        'EVENT_INVITATION_DECLINED',
        'EVENT_UPDATED',
        'EVENT_CANCELLED',
        'locationSuggestion'  
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
EventSchema.index({ 'suggestedLocations.location': '2dsphere' });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const UserFriend = mongoose.models.UserFriend || mongoose.model('UserFriend', UserFriendSchema);
const UserEvent = mongoose.models.UserEvent || mongoose.model('UserEvent', UserEventSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

export {
    UserSchema,
    EventSchema,
    UserFriendSchema,
    UserEventSchema,
    NotificationSchema,
    ChatMessageSchema,
    User,
    Event,
    UserFriend,
    UserEvent,
    Notification,
    ChatMessage,
    InviteSchema,
    Invite
};