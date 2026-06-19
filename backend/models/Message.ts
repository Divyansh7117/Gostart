// Message model — individual chat bubbles within a conversation.
// Indexed by conversationId so fetching a chat history is fast even
// with thousands of messages across all users.

import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  senderId: string;  // either a user._id or a profile._id
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, ref: 'Conversation', index: true },
    senderId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }, // Messages keep MongoDB's default ObjectId for _id
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
