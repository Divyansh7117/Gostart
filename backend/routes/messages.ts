import { Router, Request, Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { Profile } from '../models/Profile';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;

    const convos = await Conversation.find({ userId }).sort({ createdAt: -1 });

    const result = await Promise.all(
      convos.map(async (conv) => {
        const profile = await Profile.findById(conv.profileId).select('name age city photo verified');
        const lastMessage = await Message.findOne({ chatId: conv.chatId }).sort({ timestamp: -1 });

        return {
          id: conv._id,
          profile: profile
            ? { id: profile._id, name: profile.name, age: profile.age, city: profile.city, photo: profile.photo, verified: profile.verified }
            : null,
          lastMessage: lastMessage
            ? { id: lastMessage._id, senderId: lastMessage.senderId, text: lastMessage.text, timestamp: lastMessage.timestamp }
            : null,
          unreadCount: 0,
        };
      }),
    );

    result.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    res.json({ success: true, conversations: result });
  } catch (err) {
    console.error('List messages error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

router.get('/:conversationId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { userId } = (req as AuthenticatedRequest).user;

    const conv = await Conversation.findById(conversationId);
    if (!conv) { res.status(404).json({ success: false, message: 'Conversation not found.' }); return; }
    if (conv.userId !== userId) { res.status(403).json({ success: false, message: "You're not part of this conversation." }); return; }

    const profile = await Profile.findById(conv.profileId);
    const messages = await Message.find({ chatId: conv.chatId }).sort({ timestamp: 1 });

    res.json({
      success: true,
      conversation: {
        id: conv._id,
        profile: profile ? {
          id: profile._id, name: profile.name, age: profile.age, city: profile.city,
          photo: profile.photo, verified: profile.verified, about: profile.about,
          tags: profile.tags, height: profile.height, profession: profile.profession,
        } : null,
        messages: messages.map((m) => ({
          id: m._id,
          senderId: m.senderId,
          text: m.text,
          timestamp: m.timestamp,
        })),
      },
    });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

router.post('/:conversationId/send', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body as { text: string };
    const { userId } = (req as AuthenticatedRequest).user;

    if (!text?.trim()) {
      res.status(400).json({ success: false, message: 'Message cannot be empty.' });
      return;
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) { res.status(404).json({ success: false, message: 'Conversation not found.' }); return; }
    if (conv.userId !== userId) { res.status(403).json({ success: false, message: "You're not part of this conversation." }); return; }

    const newMessage = await Message.create({
      chatId: conv.chatId,
      conversationId,
      senderId: userId,
      text: text.trim(),
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: {
        id: newMessage._id,
        senderId: newMessage.senderId,
        text: newMessage.text,
        timestamp: newMessage.timestamp,
      },
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong.' });
  }
});

export default router;
