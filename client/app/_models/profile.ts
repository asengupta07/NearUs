import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for type-checking the Profile
interface IProfile extends Document {
  username: string;
  email: string;
  bio?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  avatarUrl?: string;
  friendCount?: number;
}

// Define the Profile schema
const profileSchema: Schema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String },
  location: {
    type: {
      type: String,
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number], // 'coordinates' must be an array of numbers
      required: true,
    },
  },
  avatarUrl: { type: String },
  friendCount: { type: Number },
});

// Create a geospatial index on 'location'
profileSchema.index({ location: '2dsphere' });

// Create and export the Profile model
const Profile = mongoose.models.Profile || mongoose.model<IProfile>('Profile', profileSchema);
export default Profile;
