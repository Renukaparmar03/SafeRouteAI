import express from 'express';
import { createContact, deleteContact, getMe, listContacts, updateContact, updateMe } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { contactSchema, idParams, updateMeSchema } from '../validators/schemas.js';

const router = express.Router();
router.use(protect);

router.get('/me', getMe);
router.put('/me', validate({ body: updateMeSchema }), updateMe);

router.get('/me/emergency-contacts', listContacts);
router.post('/me/emergency-contacts', validate({ body: contactSchema }), createContact);
router.put('/me/emergency-contacts/:id', validate({ params: idParams, body: contactSchema }), updateContact);
router.delete('/me/emergency-contacts/:id', validate({ params: idParams }), deleteContact);

export default router;
