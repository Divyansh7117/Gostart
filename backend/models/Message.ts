// Message model — individual chat messages, indexed by chatId for fast room queries

import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: String, required: true, index: true },
    conversationId: { type: String, ref: 'Conversation' },
    senderId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
