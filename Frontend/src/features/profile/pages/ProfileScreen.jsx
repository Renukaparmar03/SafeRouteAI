import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, User, Phone, Map, MapPin, Settings, LogOut, ChevronRight, Trash2, Plus, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import { LABELS } from '../../../constants/labels';
import BottomNavBar from '../../../components/layout/BottomNavBar';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { InlineNotice, LoadingState } from '../../../components/common/StateViews';
import { ROUTES } from '../../../constants/routes';
import { useAuth } from '../../../context/AuthContext';
import { useJourney } from '../../../context/JourneyContext';
import { userService } from '../../../services/authService';
import { tripService } from '../../../services/tripService';
import { enablePushNotifications, isFirebaseConfigured, pushPermission } from '../../../services/pushService';

const EMPTY_CONTACT = { name: '', phone: '', relationship: '' };

const Toggle = ({ checked, onChange, label, description }) => (
  <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
    <span>
      <span className="block text-[14px] font-semibold text-text-primary">{label}</span>
      {description && <span className="block text-[11px] text-text-secondary">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx('relative w-11 h-6 rounded-full transition-colors shrink-0', checked ? 'bg-primary' : 'bg-border')}
    >
      <span className={clsx('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  </label>
);

const ProfileScreen = () => {
  const navigate = useNavigate();
  const L = LABELS.PROFILE;
  const { user, setUser, logout } = useAuth();
  const journey = useJourney();
  const [panel, setPanel] = useState(null); // personal | emergency | saved | settings
  const [contacts, setContacts] = useState({ status: 'loading', list: [] });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', profileImage: '' });
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [editingContact, setEditingContact] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState({ status: 'idle', list: [] });
  const [pushState, setPushState] = useState({ busy: false, message: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userService
      .listContacts()
      .then((list) => setContacts({ status: 'success', list }))
      .catch(() => setContacts({ status: 'error', list: [] }));
  }, []);

  const openPanel = (id) => {
    setError('');
    if (id === 'personal') {
      setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', profileImage: user.profileImage || '' });
    }
    if (id === 'saved' && savedPlaces.status === 'idle') {
      setSavedPlaces({ status: 'loading', list: [] });
      tripService
        .list()
        .then((trips) => {
          const seen = new Set();
          const list = trips
            .map((t) => t.destination)
            .filter((d) => {
              const key = `${d.latitude.toFixed(4)},${d.longitude.toFixed(4)}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          setSavedPlaces({ status: 'success', list });
        })
        .catch(() => setSavedPlaces({ status: 'error', list: [] }));
    }
    setPanel(id);
  };

  const menuItems = [
    { id: 'personal', icon: User, label: L.MENU.PERSONAL_INFO },
    { id: 'emergency', icon: Phone, label: L.MENU.EMERGENCY_CONTACTS, badge: contacts.list.length ? String(contacts.list.length) : null },
    { id: 'history', icon: Map, label: L.MENU.TRAVEL_HISTORY },
    { id: 'saved', icon: MapPin, label: L.MENU.SAVED_PLACES },
    { id: 'settings', icon: Settings, label: L.MENU.SETTINGS },
    { id: 'logout', icon: LogOut, label: L.MENU.LOGOUT, isDanger: true },
  ];

  const handleLogout = async () => {
    if (journey.isActive && !window.confirm('You have an active journey. Logging out stops live tracking on this device. Continue?')) return;
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const handleMenu = (id) => {
    if (id === 'logout') handleLogout();
    else if (id === 'history') navigate(ROUTES.MY_TRIPS);
    else openPanel(id);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await userService.updateMe({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.replace(/[\s-]/g, ''),
        profileImage: profileForm.profileImage.trim(),
      });
      setUser(updated);
      setPanel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...contactForm, phone: contactForm.phone.replace(/[\s-]/g, ''), priority: editingContact?.priority || contacts.list.length + 1 };
    try {
      if (editingContact) {
        const updated = await userService.updateContact(editingContact.id, payload);
        setContacts((c) => ({ ...c, list: c.list.map((x) => (x.id === updated.id ? updated : x)) }));
      } else {
        const created = await userService.createContact(payload);
        setContacts((c) => ({ ...c, list: [...c.list, created] }));
      }
      setContactForm(EMPTY_CONTACT);
      setEditingContact(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from emergency contacts?`)) return;
    setError('');
    try {
      await userService.deleteContact(contact.id);
      setContacts((c) => ({ ...c, list: c.list.filter((x) => x.id !== contact.id) }));
    } catch (err) {
      setError(err.message);
    }
  };

  const updatePreference = async (key, value) => {
    setError('');
    const previous = user.notificationPreferences;
    setUser({ ...user, notificationPreferences: { ...previous, [key]: value } });
    try {
      const updated = await userService.updateMe({ notificationPreferences: { [key]: value } });
      setUser(updated);
    } catch (err) {
      setUser({ ...user, notificationPreferences: previous });
      setError(err.message);
    }
  };

  const enablePush = async () => {
    setPushState({ busy: true, message: '' });
    try {
      const result = await enablePushNotifications();
      setPushState({ busy: false, message: result.enabled ? 'Push notifications are enabled on this device.' : result.reason });
    } catch (err) {
      setPushState({ busy: false, message: err.message });
    }
  };

  const prefs = user?.notificationPreferences || {};
  const avatar = useMemo(
    () => user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.id || 'traveller')}&backgroundColor=e5e7eb`,
    [user]
  );

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-surface flex flex-col font-sans overflow-hidden">

      {/* Top Header - Purple Background */}
      <div className="bg-primary pt-16 pb-24 px-6 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full border-4 border-white/20 overflow-hidden shrink-0">
            <img
              src={avatar}
              alt="Profile"
              className="w-full h-full object-cover bg-white"
            />
          </div>
          {/* User Info */}
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-white mb-0.5 truncate">
              {user?.name}
            </h1>
            <p className="text-[13px] text-white/80 truncate">
              {user?.email || user?.phone}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => openPanel('personal')}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content - Overlapping White Card */}
      <div className="flex-1 bg-white rounded-t-[32px] -mt-8 relative z-10 px-5 pt-8 pb-28 shadow-[0_-8px_24px_rgba(0,0,0,0.05)] overflow-y-auto">

        <div className="flex flex-col gap-1">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <button
                onClick={() => handleMenu(item.id)}
                className="w-full flex items-center justify-between py-4 group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <item.icon
                    className={`w-5 h-5 ${item.isDanger ? 'text-danger' : 'text-text-secondary group-hover:text-primary transition-colors'}`}
                    strokeWidth={2}
                  />
                  <span className={`text-[15px] font-semibold ${item.isDanger ? 'text-danger' : 'text-text-primary'}`}>
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Badge */}
                  {item.badge && (
                    <div className="w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </div>
                  )}
                  {/* Chevron */}
                  <ChevronRight className="w-5 h-5 text-text-secondary/50" />
                </div>
              </button>

              {/* Separator Line */}
              {index < menuItems.length - 1 && (
                <div className="h-[1px] w-full bg-border/40 my-1"></div>
              )}
            </React.Fragment>
          ))}
        </div>

      </div>

      <BottomNavBar />

      {/* Personal information */}
      <Modal open={panel === 'personal'} onClose={() => setPanel(null)} title={L.MENU.PERSONAL_INFO}>
        <form onSubmit={saveProfile}>
          <Input id="profile-name" label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required minLength={2} />
          <Input id="profile-email" label="Email" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="you@example.com" />
          <Input id="profile-phone" label="Phone" type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91XXXXXXXXXX" />
          <Input id="profile-image" label="Profile Image URL" type="url" value={profileForm.profileImage} onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })} placeholder="https://…" />
          {error && <InlineNotice tone="danger" className="mb-4">{error}</InlineNotice>}
          <Button type="submit" size="lg" isLoading={saving} className="w-full py-3.5 rounded-xl">Save Changes</Button>
        </form>
      </Modal>

      {/* Emergency contacts */}
      <Modal
        open={panel === 'emergency'}
        onClose={() => {
          setPanel(null);
          setEditingContact(null);
          setContactForm(EMPTY_CONTACT);
        }}
        title={L.MENU.EMERGENCY_CONTACTS}
      >
        {contacts.status === 'loading' ? (
          <LoadingState />
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            {contacts.list.length === 0 && <p className="text-[12px] text-text-secondary">No emergency contacts yet. Add someone who should know when you send an SOS.</p>}
            {contacts.list.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-background rounded-xl p-3 border border-border">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-text-primary truncate">{c.name}{c.isDemo && <span className="ml-1 text-[9px] text-warning">DEMO</span>}</p>
                  <p className="text-[11px] text-text-secondary">{c.phone}{c.relationship ? ` · ${c.relationship}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingContact(c);
                      setContactForm({ name: c.name, phone: c.phone, relationship: c.relationship || '' });
                    }}
                    className="p-2 text-text-secondary hover:text-primary"
                    aria-label={`Edit ${c.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteContact(c)} className="p-2 text-text-secondary hover:text-danger" aria-label={`Delete ${c.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={saveContact}>
          <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-3">{editingContact ? 'Edit contact' : 'Add contact'}</p>
          <Input id="contact-name" label="Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required minLength={2} />
          <Input id="contact-phone" label="Phone" type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="+91XXXXXXXXXX" required />
          <Input id="contact-relationship" label="Relationship" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} placeholder="e.g. Mother, Friend" />
          {error && <InlineNotice tone="danger" className="mb-4">{error}</InlineNotice>}
          <div className="flex gap-3">
            {editingContact && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingContact(null);
                  setContactForm(EMPTY_CONTACT);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={saving} disabled={!editingContact && contacts.list.length >= 5} className="flex-1 rounded-xl py-3.5">
              {!saving && !editingContact && <Plus className="w-4 h-4 mr-1" />}
              {editingContact ? 'Save Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Saved places (destinations from your trips) */}
      <Modal open={panel === 'saved'} onClose={() => setPanel(null)} title={L.MENU.SAVED_PLACES}>
        {savedPlaces.status === 'loading' ? (
          <LoadingState />
        ) : savedPlaces.status === 'error' ? (
          <p className="text-[12px] text-danger">Could not load your places. Please try again.</p>
        ) : savedPlaces.list.length === 0 ? (
          <p className="text-[12px] text-text-secondary">Places you plan trips to will appear here.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {savedPlaces.list.map((place) => (
              <button
                key={`${place.latitude},${place.longitude}`}
                onClick={() => navigate(ROUTES.MAP, { state: { destination: { ...place, fullAddress: place.name } } })}
                className="flex items-center gap-3 bg-background rounded-xl p-3 border border-border text-left hover:border-primary/40"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[13px] font-semibold text-text-primary truncate">{place.name}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* Settings: notification preferences */}
      <Modal open={panel === 'settings'} onClose={() => setPanel(null)} title={L.MENU.SETTINGS}>
        <p className="text-[12px] font-bold text-text-secondary uppercase tracking-wider mb-1">Notifications</p>
        <div className="divide-y divide-border/60 mb-4">
          <Toggle label="Push notifications" description="Browser notifications when the app is in the background" checked={prefs.push !== false} onChange={(v) => updatePreference('push', v)} />
          <Toggle label="Risk alerts" checked={prefs.riskAlerts !== false} onChange={(v) => updatePreference('riskAlerts', v)} />
          <Toggle label="Trip updates" checked={prefs.tripUpdates !== false} onChange={(v) => updatePreference('tripUpdates', v)} />
          <Toggle label="Weather alerts" checked={prefs.weatherAlerts !== false} onChange={(v) => updatePreference('weatherAlerts', v)} />
        </div>
        <p className="text-[11px] text-text-secondary mb-3">In-app alerts are always shown; these switches control push notifications.</p>
        <Button
          variant="outline"
          onClick={enablePush}
          isLoading={pushState.busy}
          disabled={!isFirebaseConfigured()}
          className="w-full rounded-xl py-3"
        >
          {pushPermission() === 'granted' ? 'Re-register this device for push' : 'Enable push on this device'}
        </Button>
        {!isFirebaseConfigured() && <p className="text-[11px] text-text-secondary mt-2">Push is not configured for this app build (missing Firebase web settings).</p>}
        {pushState.message && <InlineNotice tone="info" className="mt-3">{pushState.message}</InlineNotice>}
        {error && <InlineNotice tone="danger" className="mt-3">{error}</InlineNotice>}
      </Modal>
    </div>
  );
};

export default ProfileScreen;
