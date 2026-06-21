// Profile model — the dating card that gets shown to other users during matching
// separate from User so we can seed fake profiles without creating real accounts

import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document<string> {
  _id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  height: string;
  religion: string;
  profession: string;
  college?: string;
  distance: string;
  about: string;
  tags: string[];
  weekendVibe: string;
  firstDateIdea: string;
  loveLanguage: string;
  verified: boolean;
  photo: string;
  createdAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 18 },
    gender: { type: String, required: true },
    city: { type: String, required: true },
    height: { type: String, required: true },
    religion: { type: String, required: true },
    profession: { type: String, required: true },
    college: { type: String },
    distance: { type: String, required: true },
    about: { type: String, required: true },
    tags: [{ type: String }],
    weekendVibe: { type: String, required: true },
    firstDateIdea: { type: String, required: true },
    loveLanguage: { type: String, required: true },
    verified: { type: Boolean, default: false },
    photo: { type: String, required: true },
  },
  {
    timestamps: true,
    _id: false,
  },
);

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
