// UserFilter model — each user's saved search preferences.
// One document per user (userId is unique). Upserted on every save.

import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFilter extends Document {
  userId: string;
  lookingFor: string;
  minAge: number;
  maxAge: number;
  location: string;
  religion: string | null;
  profession: string | null;
  updatedAt: Date;
}

const UserFilterSchema = new Schema<IUserFilter>(
  {
    userId: { type: String, required: true, unique: true, ref: 'User' },
    lookingFor: { type: String, default: 'Women' },
    minAge: { type: Number, default: 20 },
    maxAge: { type: Number, default: 35 },
    location: { type: String, default: 'Nearby' },
    religion: { type: String, default: null },
    profession: { type: String, default: null },
  },
  { timestamps: true },
);

export const UserFilter = mongoose.model<IUserFilter>('UserFilter', UserFilterSchema);
