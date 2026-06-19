// Conversation model — one document per user↔profile chat thread.
// The unique index on (userId, profileId) prevents accidentally starting
// two conversations with the same person.

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document<string> {
  _id: string;
  userId: string;
  profileId: string;
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    profileId: { type: String, required: true, ref: 'Profile' },
  },
  {
    timestamps: true,
    _id: false,
  },
);

// Compound unique index — one conversation per user+profile pair
ConversationSchema.index({ userId: 1, profileId: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
