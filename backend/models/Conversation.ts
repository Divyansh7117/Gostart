// Conversation model — links a user to a profile they've connected with
// chatId is the shared room id used by websocket so both sides can find the same room

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document<string> {
  _id: string;
  userId: string;
  profileId: string;
  chatId: string;
  createdAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, ref: 'User' },
    profileId: { type: String, required: true, ref: 'Profile' },
    chatId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    _id: false,
  },
);

// unique compound index so a user can only have one conversation per profile
ConversationSchema.index({ userId: 1, profileId: 1 }, { unique: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
