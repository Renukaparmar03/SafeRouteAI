import express from 'express';
import { chat, clearHistory, history } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { aiChatSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.post('/chat', aiLimiter, validate({ body: aiChatSchema }), chat);
router.get('/history', history);
router.delete('/history', clearHistory);

export default router;
