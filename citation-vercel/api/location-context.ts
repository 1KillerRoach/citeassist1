const ARCGIS_GEOCODER =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

async function reverseForType(lat: number, lon: number, featureType: string): Promise<string> {
  const params = new URLSearchParams({
    f: "json",
    location: `${lon},${lat}`,
    featureTypes: featureType
  });

  const response = await fetch(`${ARCGIS_GEOCODER}/reverseGeocode?${params.toString()}`);

  if (!response.ok) return "";

  const data: any = await response.json();
  return (
    data?.address?.Match_addr ||
    data?.address?.LongLabel ||
    data?.address?.ShortLabel ||
    ""
  );
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

  try {
    const [pointAddress, streetAddress, intersection] = await Promise.all([
      reverseForType(lat, lon, "PointAddress"),
      reverseForType(lat, lon, "StreetAddress"),
      reverseForType(lat, lon, "StreetInt")
    ]);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      nearestAddress:
        pointAddress ||
        streetAddress ||
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      nearestIntersection:
        intersection ||
        "No nearby intersection found"
    });
  } catch {
    res.status(200).json({
      nearestAddress: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      nearestIntersection: "Unavailable"
    });
  }
}
