import * as turf from '@turf/turf';
import RiskZone from '../models/RiskZone.js';
import { badRequest, notFound, sendSuccess } from '../utils/responseUtils.js';
import { boxAroundPoint, circlePolygon } from '../utils/geoUtils.js';
import { findZonesNear } from '../services/riskService.js';
import { emitToAdmins } from '../sockets/socketEmitter.js';

const featureCollection = (zones) => ({ type: 'FeatureCollection', features: zones.map((z) => z.toFeature()) });

// GET /api/risk-zones?lat=&lng=&radius=&bbox=&riskLevel=
export const listZones = async (req, res) => {
  const { lat, lng, radius, bbox, riskLevel, includeInactive } = req.valid.query;
  const filter = includeInactive === 'true' && req.user?.role === 'admin' ? {} : RiskZone.activeFilter();
  if (riskLevel) filter.riskLevel = riskLevel;

  if (bbox) {
    const [minX, minY, maxX, maxY] = bbox.split(',').map(Number);
    filter.geometry = { $geoIntersects: { $geometry: turf.bboxPolygon([minX, minY, maxX, maxY]).geometry } };
  } else if (Number.isFinite(lat) && Number.isFinite(lng)) {
    filter.geometry = { $geoIntersects: { $geometry: boxAroundPoint(lat, lng, radius) } };
  }

  const zones = await RiskZone.find(filter).sort({ updatedAt: -1 }).limit(1000);
  sendSuccess(res, featureCollection(zones));
};

// GET /api/risk-zones/nearby?lat=&lng=&radius=
export const nearbyZones = async (req, res) => {
  const { lat, lng, radius } = req.valid.query;
  const zones = await findZonesNear({ lat, lng, radius, includeAllHours: true });
  sendSuccess(res, { zones });
};

// GET /api/risk-zones/:id
export const getZone = async (req, res) => {
  const zone = await RiskZone.findById(req.valid.params.id);
  if (!zone || (!zone.active && req.user?.role !== 'admin')) throw notFound('Risk zone not found');
  sendSuccess(res, { zone: zone.toFeature() });
};

const buildGeometry = ({ geometry, latitude, longitude, radius }) => {
  if (geometry) {
    let feature;
    try {
      feature = turf.feature(geometry);
      if (!turf.booleanValid(feature)) throw new Error('invalid');
    } catch {
      throw badRequest('The zone polygon is not valid GeoJSON. Make sure the ring is closed and does not self-intersect.');
    }
    const [lng, lat] = turf.centroid(feature).geometry.coordinates;
    return { geometry, center: { latitude: lat, longitude: lng }, radius: undefined };
  }
  return { geometry: circlePolygon(latitude, longitude, radius), center: { latitude, longitude }, radius };
};

// POST /api/admin/risk-zones
export const createZone = async (req, res) => {
  const body = req.valid.body;
  const geo = buildGeometry(body);
  const zone = await RiskZone.create({
    name: body.name,
    description: body.description,
    riskLevel: body.riskLevel,
    activeHours: body.activeHours,
    sourceType: body.sourceType,
    sourceName: body.sourceName || (body.sourceType === 'ADMIN' ? `Admin: ${req.user.name}` : ''),
    confidence: body.confidence,
    active: body.active,
    validFrom: body.validFrom || undefined,
    validUntil: body.validUntil || undefined,
    createdBy: req.user._id,
    ...geo,
  });
  emitToAdmins('admin:zone-updated', { action: 'created', zone: zone.toFeature() });
  sendSuccess(res, { zone: zone.toFeature() }, 201);
};

// PUT /api/admin/risk-zones/:id
export const updateZone = async (req, res) => {
  const zone = await RiskZone.findById(req.valid.params.id);
  if (!zone) throw notFound('Risk zone not found');
  const body = req.valid.body;

  const geometryChanged = body.geometry || body.latitude !== undefined || body.longitude !== undefined || body.radius !== undefined;
  if (geometryChanged) {
    const geo = buildGeometry({
      geometry: body.geometry,
      latitude: body.latitude ?? zone.center.latitude,
      longitude: body.longitude ?? zone.center.longitude,
      radius: body.radius ?? zone.radius ?? 300,
    });
    Object.assign(zone, geo);
  }
  ['name', 'description', 'riskLevel', 'activeHours', 'sourceType', 'sourceName', 'confidence', 'active', 'validFrom', 'validUntil'].forEach(
    (key) => {
      if (body[key] !== undefined) zone[key] = body[key] ?? undefined;
    }
  );
  await zone.save();
  emitToAdmins('admin:zone-updated', { action: 'updated', zone: zone.toFeature() });
  sendSuccess(res, { zone: zone.toFeature() });
};

// DELETE /api/admin/risk-zones/:id  (soft-disable; ?hard=true deletes permanently)
export const deleteZone = async (req, res) => {
  const zone = await RiskZone.findById(req.valid.params.id);
  if (!zone) throw notFound('Risk zone not found');
  if (req.query.hard === 'true') {
    await zone.deleteOne();
    emitToAdmins('admin:zone-updated', { action: 'deleted', id: zone._id.toString() });
    return sendSuccess(res, { deleted: true });
  }
  zone.active = false;
  await zone.save();
  emitToAdmins('admin:zone-updated', { action: 'disabled', zone: zone.toFeature() });
  sendSuccess(res, { zone: zone.toFeature() });
};
