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

const MessageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ createdAt: -1 });

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    message: { type: String, required: true },
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
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);


export {
    UserSchema,
    EventSchema,
    UserFriendSchema,
    UserEventSchema,
    NotificationSchema,
    MessageSchema,
    User,
    Event,
    UserFriend,
    UserEvent,
    Notification,
    Message
};