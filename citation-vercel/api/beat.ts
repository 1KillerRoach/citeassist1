const BEAT_QUERY_URL =
  "https://webmaps.sandiego.gov/arcgis/rest/services/Hosted/LAW_SDPD_BEATS/FeatureServer/0/query";

const BEAT_CODE_URL =
  "https://seshat.datasd.org/gis_police_beats/pd_beat_codes_list_datasd.csv";

type BeatLookupRow = {
  beat: string;
  neighborhood: string;
};

let beatCodeCache: BeatLookupRow[] | null = null;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

async function loadBeatCodes(): Promise<BeatLookupRow[]> {
  if (beatCodeCache) return beatCodeCache;

  const response = await fetch(BEAT_CODE_URL, {
    headers: { "User-Agent": "citeassist-beat-finder/1.0" }
  });

  if (!response.ok) {
    throw new Error(`Beat code list returned ${response.status}`);
  }

  const csv = await response.text();
  const lines = csv.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Beat code list is empty.");
  }

  const headers = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
  const beatIndex = headers.findIndex((value) => value === "beat");
  const neighborhoodIndex = headers.findIndex((value) =>
    ["neighborhood", "name", "beat_name"].includes(value)
  );

  if (beatIndex < 0 || neighborhoodIndex < 0) {
    throw new Error("Beat code list format has changed.");
  }

  const rows = lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return {
      beat: String(columns[beatIndex] || "").trim(),
      neighborhood: String(columns[neighborhoodIndex] || "").trim()
    };
  }).filter((row) => row.beat && row.neighborhood);

  beatCodeCache = rows;
  return rows;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function lookupBeatNumber(neighborhood: string): Promise<string> {
  const rows = await loadBeatCodes();
  const target = normalize(neighborhood);

  const exact = rows.find((row) => normalize(row.neighborhood) === target);
  if (exact) return exact.beat;

  const partial = rows.find((row) => {
    const candidate = normalize(row.neighborhood);
    return candidate.includes(target) || target.includes(candidate);
  });

  return partial?.beat || "";
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

  const geometry = JSON.stringify({
    x: lon,
    y: lat,
    spatialReference: { wkid: 4326 }
  });

  const params = new URLSearchParams({
    f: "json",
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "name",
    returnGeometry: "false"
  });

  try {
    const response = await fetch(`${BEAT_QUERY_URL}?${params.toString()}`, {
      headers: { "User-Agent": "citeassist-beat-finder/1.0" }
    });

    if (!response.ok) {
      throw new Error(`City GIS returned ${response.status}`);
    }

    const data: any = await response.json();

    if (data?.error) {
      throw new Error(data.error.message || "City GIS query failed.");
    }

    const feature = data?.features?.[0];

    if (!feature?.attributes?.name) {
      res.status(200).json({ properties: null });
      return;
    }

    const neighborhood = String(feature.attributes.name).trim();
    const beat = await lookupBeatNumber(neighborhood);

    if (!beat) {
      res.status(200).json({
        properties: {
          beat: "Unknown",
          name: neighborhood,
          serv: "",
          div: ""
        },
        warning: "Neighborhood was located, but its beat number could not be matched."
      });
      return;
    }

    const div = beat.slice(0, 1);
    const serv = beat.length >= 2 ? `${beat.slice(0, 2)}0` : "";

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      properties: {
        beat,
        name: neighborhood,
        serv,
        div
      }
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error
        ? `Beat service unavailable: ${error.message}`
        : "Beat service unavailable."
    });
  }
}
