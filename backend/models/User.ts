// User model — the people who register and use the app.
// _id is a plain string (we generate our own UUIDs) instead of MongoDB's
// default ObjectId, so our API responses stay consistent and readable.

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document<string> {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  age: number;
  gender: string;
  city?: string;
  height?: string;
  religion?: string;
  profession?: string;
  college?: string;
  about?: string;
  tags?: string[];
  weekendVibe?: string;
  firstDateIdea?: string;
  loveLanguage?: string;
  photo?: string;
  credits: number;
  onboardingComplete: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, required: true, min: 18, max: 100 },
    gender: { type: String, required: true, enum: ['male', 'female', 'non-binary', 'other'] },
    city: { type: String },
    height: { type: String },
    religion: { type: String },
    profession: { type: String },
    college: { type: String },
    about: { type: String },
    tags: [{ type: String }],
    weekendVibe: { type: String },
    firstDateIdea: { type: String },
    loveLanguage: { type: String },
    photo: { type: String },
    credits: { type: Number, default: 2, min: 0 },
    onboardingComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
    _id: false,         // we provide our own _id, don't let Mongoose override it
  },
);

export const User = mongoose.model<IUser>('User', UserSchema);
