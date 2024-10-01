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
    preferredLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    }
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

UserSchema.index({ username: 'text', email: 'text' });

UserSchema.index({ email: 1, username: 1 });

export {
    UserSchema,
    EventSchema,
    UserFriendSchema,
    UserEventSchema
};