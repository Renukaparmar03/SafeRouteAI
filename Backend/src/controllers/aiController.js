import AIConversation from '../models/AIConversation.js';
import { notFound, sendSuccess } from '../utils/responseUtils.js';
import { buildContext, generateReply } from '../services/aiService.js';

const serializeMessage = (m) => ({ id: m._id.toString(), role: m.role, content: m.content, createdAt: m.createdAt });

// POST /api/ai/chat
export const chat = async (req, res) => {
  const { message, tripId, latitude, longitude, conversationId } = req.valid.body;
  const user = req.user;

  let conversation = conversationId
    ? await AIConversation.findOne({ _id: conversationId, userId: user._id })
    : await AIConversation.findOne({ userId: user._id }).sort({ updatedAt: -1 });
  if (conversationId && !conversation) throw notFound('Conversation not found');

  const context = await buildContext({ user, tripId, latitude: latitude ?? undefined, longitude: longitude ?? undefined });
  const reply = await generateReply({ history: conversation?.messages || [], message, contextText: context.text });

  if (!conversation) conversation = new AIConversation({ userId: user._id, tripId: context.trip?._id });
  conversation.messages.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
  // Keep stored history bounded.
  if (conversation.messages.length > 200) conversation.messages = conversation.messages.slice(-200);
  if (context.trip?._id) conversation.tripId = context.trip._id;
  await conversation.save();

  const [userMsg, aiMsg] = conversation.messages.slice(-2);
  sendSuccess(res, {
    conversationId: conversation._id.toString(),
    userMessage: serializeMessage(userMsg),
    reply: serializeMessage(aiMsg),
    contextUsed: context.used,
  });
};

// GET /api/ai/history
export const history = async (req, res) => {
  const conversation = await AIConversation.findOne({ userId: req.user._id }).sort({ updatedAt: -1 });
  sendSuccess(res, {
    conversationId: conversation?._id.toString() || null,
    messages: (conversation?.messages || []).slice(-50).map(serializeMessage),
  });
};

// DELETE /api/ai/history — starts a fresh conversation.
export const clearHistory = async (req, res) => {
  await AIConversation.deleteMany({ userId: req.user._id });
  sendSuccess(res, { cleared: true });
};
