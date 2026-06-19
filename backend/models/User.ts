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
  credits: number;
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
    credits: { type: Number, default: 2, min: 0 },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt automatically
    _id: false,         // we provide our own _id, don't let Mongoose override it
  },
);

export const User = mongoose.model<IUser>('User', UserSchema);
