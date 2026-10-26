import { feature as topojsonFeature } from "topojson-client";

const BEAT_TOPOJSON_URL =
  "https://seshat.datasd.org/gis_police_beats/pd_beats_datasd.topo.json";

let featureCache: any[] | null = null;

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: [number, number], coordinates: number[][][]): boolean {
  if (!coordinates.length || !pointInRing(point, coordinates[0])) return false;
  return !coordinates.slice(1).some((hole) => pointInRing(point, hole));
}

function containsPoint(candidate: any, point: [number, number]): boolean {
  const geometry = candidate?.geometry;
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon: number[][][]) =>
      pointInPolygon(point, polygon)
    );
  }

  return false;
}

async function loadFeatures(): Promise<any[]> {
  if (featureCache) return featureCache;

  const response = await fetch(BEAT_TOPOJSON_URL, {
    headers: { "User-Agent": "citeassist-beat-finder/1.0" }
  });

  if (!response.ok) {
    throw new Error(`City beat data returned ${response.status}`);
  }

  const topology: any = await response.json();
  const objectKey = Object.keys(topology.objects || {})[0];

  if (!objectKey) throw new Error("City beat boundary data is unavailable.");

  const converted: any = topojsonFeature(
    topology as any,
    topology.objects[objectKey] as any
  );

  const features: any[] =
    converted.type === "FeatureCollection" ? converted.features : [converted];

  featureCache = features;
  return features;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: "Valid latitude and longitude are required." });
    return;
  }

  if (lat < 32.4 || lat > 33.3 || lon < -117.7 || lon > -116.3) {
    res.status(400).json({ error: "Location is outside the San Diego search area." });
    return;
  }

  try {
    const features = await loadFeatures();
    const match = features.find((candidate) =>
      containsPoint(candidate, [lon, lat])
    );

    if (!match) {
      res.status(200).json({ properties: null });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ properties: match.properties || null });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error
        ? `Beat service unavailable: ${error.message}`
        : "Beat service unavailable."
    });
  }
}
