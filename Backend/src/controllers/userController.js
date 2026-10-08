import User from '../models/User.js';
import EmergencyContact from '../models/EmergencyContact.js';
import { badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';

const MAX_CONTACTS = 5;

const serializeContact = (c) => ({
  id: c._id.toString(),
  name: c.name,
  phone: c.phone,
  relationship: c.relationship,
  priority: c.priority,
  isDemo: Boolean(c.isDemo),
});

// GET /api/users/me
export const getMe = async (req, res) => {
  const contacts = await EmergencyContact.find({ userId: req.user._id }).sort({ priority: 1, createdAt: 1 });
  sendSuccess(res, { user: { ...req.user.toPublicJSON(), emergencyContacts: contacts.map(serializeContact) } });
};

// PUT /api/users/me
export const updateMe = async (req, res) => {
  const { name, email, phone, profileImage, notificationPreferences } = req.valid.body;
  const user = req.user;

  if (email !== undefined && email !== (user.email || '')) {
    if (email && (await User.exists({ email, _id: { $ne: user._id } }))) throw badRequest('This email is already in use.');
    user.email = email || undefined;
  }
  if (phone !== undefined && phone !== (user.phone || '')) {
    if (phone && (await User.exists({ phone, _id: { $ne: user._id } }))) throw badRequest('This phone number is already in use.');
    user.phone = phone || undefined;
  }
  if (!user.email && !user.phone) throw badRequest('Keep at least an email or a phone number on your account.');
  if (name !== undefined) user.name = name;
  if (profileImage !== undefined) user.profileImage = profileImage || undefined;
  if (notificationPreferences) {
    user.notificationPreferences = { ...user.notificationPreferences?.toObject?.(), ...notificationPreferences };
  }

  await user.save();
  sendSuccess(res, { user: user.toPublicJSON() });
};

// GET /api/users/me/emergency-contacts
export const listContacts = async (req, res) => {
  const contacts = await EmergencyContact.find({ userId: req.user._id }).sort({ priority: 1, createdAt: 1 });
  sendSuccess(res, { contacts: contacts.map(serializeContact) });
};

// POST /api/users/me/emergency-contacts
export const createContact = async (req, res) => {
  const count = await EmergencyContact.countDocuments({ userId: req.user._id });
  if (count >= MAX_CONTACTS) throw badRequest(`You can save up to ${MAX_CONTACTS} emergency contacts.`);
  const contact = await EmergencyContact.create({ ...req.valid.body, userId: req.user._id });
  sendSuccess(res, { contact: serializeContact(contact) }, 201);
};

// PUT /api/users/me/emergency-contacts/:id
export const updateContact = async (req, res) => {
  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: req.valid.params.id, userId: req.user._id },
    req.valid.body,
    { new: true, runValidators: true }
  );
  if (!contact) throw notFound('Contact not found');
  sendSuccess(res, { contact: serializeContact(contact) });
};

// DELETE /api/users/me/emergency-contacts/:id
export const deleteContact = async (req, res) => {
  const result = await EmergencyContact.deleteOne({ _id: req.valid.params.id, userId: req.user._id });
  if (!result.deletedCount) throw notFound('Contact not found');
  sendSuccess(res, { deleted: true });
};
