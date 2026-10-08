import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Circle, Hexagon, Undo2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import MapView from '../../../components/map/MapView';
import { LoadingState } from '../../../components/common/StateViews';
import { adminService } from '../../../services/adminService';

const INPUT =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200';
const LABEL = 'block text-sm font-semibold text-text-primary mb-2';

/** Approximate circle polygon for the live preview (the server stores its own exact geometry). */
const circleFeature = (lat, lng, radius) => {
  const points = 48;
  const coords = [];
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radius / 111320) * Math.cos(angle);
    const dLng = (radius / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lng + dLng, lat + dLat]);
  }
  return { type: 'Polygon', coordinates: [coords] };
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const AddDangerZone = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const preset = useLocation().state || {};
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    lat: preset.latitude ? preset.latitude.toFixed(6) : '',
    lng: preset.longitude ? preset.longitude.toFixed(6) : '',
    radius: '300',
    riskLevel: preset.riskLevel || 'MEDIUM',
    activeTime: 'ALWAYS',
    sourceType: 'ADMIN',
    sourceName: '',
    confidence: '70',
    validFrom: '',
    validUntil: '',
    active: true,
    description: ''
  });
  const [mode, setMode] = useState('circle'); // circle | polygon
  const [polygon, setPolygon] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    adminService
      .zone(id)
      .then((zone) => {
        const p = zone.properties;
        setFormData({
          name: p.name,
          lat: String(p.center.latitude),
          lng: String(p.center.longitude),
          radius: String(p.radius || 300),
          riskLevel: p.riskLevel,
          activeTime: p.activeHours,
          sourceType: p.sourceType,
          sourceName: p.sourceName || '',
          confidence: String(Math.round((p.confidence ?? 0.7) * 100)),
          validFrom: toDateInput(p.validFrom),
          validUntil: toDateInput(p.validUntil),
          active: p.active,
          description: p.description || ''
        });
        if (!p.radius && zone.geometry.type === 'Polygon') {
          setMode('polygon');
          setPolygon(zone.geometry.coordinates[0].slice(0, -1));
        }
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { id: field, type, value, checked } = e.target;
    setFormData({ ...formData, [field]: type === 'checkbox' ? checked : value });
  };

  const lat = Number(formData.lat);
  const lng = Number(formData.lng);
  const hasPoint = formData.lat !== '' && formData.lng !== '' && Number.isFinite(lat) && Number.isFinite(lng);

  const preview = useMemo(() => {
    let geometry = null;
    if (mode === 'polygon' && polygon.length >= 3) geometry = { type: 'Polygon', coordinates: [[...polygon, polygon[0]]] };
    if (mode === 'circle' && hasPoint && Number(formData.radius) > 0) geometry = circleFeature(lat, lng, Number(formData.radius));
    if (!geometry) return null;
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry, properties: { name: formData.name || 'New zone', riskLevel: formData.riskLevel, active: true } }],
    };
  }, [mode, polygon, hasPoint, lat, lng, formData.radius, formData.name, formData.riskLevel]);

  const markers = useMemo(() => {
    if (mode === 'polygon') return polygon.map(([pLng, pLat], i) => ({ id: `v${i}`, kind: 'origin', latitude: pLat, longitude: pLng }));
    return hasPoint ? [{ id: 'center', kind: 'destination', latitude: lat, longitude: lng }] : [];
  }, [mode, polygon, hasPoint, lat, lng]);

  const handleMapClick = ({ latitude, longitude }) => {
    if (mode === 'polygon') {
      setPolygon((pts) => [...pts, [longitude, latitude]]);
    } else {
      setFormData((f) => ({ ...f, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (mode === 'polygon' && polygon.length < 3) {
      setErrorMessage('Click at least 3 points on the map to draw the polygon.');
      return;
    }
    if (mode === 'circle' && !hasPoint) {
      setErrorMessage('Enter coordinates or click the map to place the zone.');
      return;
    }
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      riskLevel: formData.riskLevel,
      activeHours: formData.activeTime,
      sourceType: formData.sourceType,
      sourceName: formData.sourceName.trim(),
      confidence: Number(formData.confidence) / 100,
      active: formData.active,
      validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
      validUntil: formData.validUntil ? new Date(`${formData.validUntil}T23:59:59`).toISOString() : null,
      ...(mode === 'polygon'
        ? { geometry: { type: 'Polygon', coordinates: [[...polygon, polygon[0]]] } }
        : { latitude: lat, longitude: lng, radius: Number(formData.radius) }),
    };
    setSaving(true);
    try {
      if (isEdit) await adminService.updateZone(id, payload);
      else await adminService.createZone(payload);
      navigate('/admin/zones');
    } catch (err) {
      setErrorMessage(err.message);
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading zone…" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/50 border border-gray-200 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{isEdit ? 'Edit Risk Zone' : 'Add Risk Zone'}</h1>
          <p className="text-text-secondary text-sm">{isEdit ? 'Update this zone on the map' : 'Create a new risk area on the map'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Form */}
        <GlassCard className="p-8">
          <form onSubmit={handleSave} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm font-medium border border-red-200">{errorMessage}</div>
            )}
            <div>
              <label className={LABEL} htmlFor="name">
                Zone Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={INPUT}
                placeholder="e.g. Highway 45 Construction"
                required
                minLength={2}
              />
            </div>

            {/* Geometry mode */}
            <div className="flex bg-white/60 border border-gray-200 rounded-xl p-1">
              {[
                { id: 'circle', label: 'Circle (center + radius)', icon: Circle },
                { id: 'polygon', label: 'Polygon (draw on map)', icon: Hexagon },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${mode === m.id ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}
                >
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>

            {mode === 'circle' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={LABEL} htmlFor="lat">
                    Latitude
                  </label>
                  <input id="lat" type="number" step="any" min="-90" max="90" value={formData.lat} onChange={handleChange} className={INPUT} placeholder="22.7196" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor="lng">
                    Longitude
                  </label>
                  <input id="lng" type="number" step="any" min="-180" max="180" value={formData.lng} onChange={handleChange} className={INPUT} placeholder="75.8577" required />
                </div>
                <div>
                  <label className={LABEL} htmlFor="radius">
                    Radius (m)
                  </label>
                  <input id="radius" type="number" min="20" max="50000" value={formData.radius} onChange={handleChange} className={INPUT} required />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white/60 border border-gray-200 rounded-xl px-4 py-3 text-sm">
                <span className="text-text-secondary">{polygon.length} point{polygon.length === 1 ? '' : 's'} placed (min 3)</span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPolygon((p) => p.slice(0, -1))} className="text-primary font-semibold flex items-center gap-1">
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button type="button" onClick={() => setPolygon([])} className="text-danger font-semibold">Clear</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="riskLevel">
                  Risk Level
                </label>
                <select id="riskLevel" value={formData.riskLevel} onChange={handleChange} className={INPUT}>
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="activeTime">
                  Active Time
                </label>
                <select id="activeTime" value={formData.activeTime} onChange={handleChange} className={INPUT}>
                  <option value="ALWAYS">Always Active</option>
                  <option value="NIGHT">Night Time Only</option>
                  <option value="DAY">Day Time Only</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="sourceType">
                  Source
                </label>
                <select id="sourceType" value={formData.sourceType} onChange={handleChange} className={INPUT}>
                  <option value="ADMIN">Admin verified</option>
                  <option value="OFFICIAL">Official dataset</option>
                  <option value="COMMUNITY">Community report</option>
                  <option value="DEMO">DEMO (test data)</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="confidence">
                  Confidence ({formData.confidence}%)
                </label>
                <input id="confidence" type="range" min="0" max="100" step="5" value={formData.confidence} onChange={handleChange} className="w-full mt-3 accent-primary" />
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor="sourceName">
                Source Name / Reference
              </label>
              <input
                id="sourceName"
                type="text"
                value={formData.sourceName}
                onChange={handleChange}
                className={INPUT}
                placeholder="e.g. District police advisory, field verification"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="validFrom">
                  Valid From (optional)
                </label>
                <input id="validFrom" type="date" value={formData.validFrom} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className={LABEL} htmlFor="validUntil">
                  Valid Until (optional)
                </label>
                <input id="validUntil" type="date" min={formData.validFrom || undefined} value={formData.validUntil} onChange={handleChange} className={INPUT} />
              </div>
            </div>

            <div>
              <label className={LABEL} htmlFor="description">
                Description / Warning Message
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                className={`${INPUT} resize-none`}
                placeholder="Describe why this zone is risky…"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input id="active" type="checkbox" checked={formData.active} onChange={handleChange} className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary" />
              <span className="text-sm font-semibold text-text-primary">Zone is active</span>
            </label>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl font-semibold text-text-secondary hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-semibold shadow-lg shadow-danger/25 transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-5 h-5" /> {saving ? 'Saving…' : 'Save Zone'}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Right Side - Interactive Map Area */}
        <GlassCard className="p-0 border-0 h-full min-h-[500px] relative overflow-hidden bg-[#E5E3DF]">
          <MapView
            center={hasPoint ? { latitude: lat, longitude: lng } : null}
            zoom={14}
            zones={preview}
            markers={markers}
            onMapClick={handleMapClick}
            variant="light"
              zoomControl
            className="absolute inset-0"
          />

          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Location Selector</p>
                <p className="text-xs text-text-secondary mt-1">
                  {mode === 'circle'
                    ? 'Type the exact coordinates or click the map to set the zone centre.'
                    : 'Click the map to add polygon corners in order. Use Undo to remove the last point.'}
                  {' '}Only mark areas backed by a verifiable source.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AddDangerZone;
