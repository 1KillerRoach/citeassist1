const ARCGIS_GEOCODER =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

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

  const params = new URLSearchParams({
    f: "json",
    location: `${lon},${lat}`
  });

  try {
    const response = await fetch(
      `${ARCGIS_GEOCODER}/reverseGeocode?${params.toString()}`
    );

    if (!response.ok) {
      res.status(200).json({ address: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
      return;
    }

    const data: any = await response.json();

    res.status(200).json({
      address:
        data?.address?.Match_addr ||
        data?.address?.LongLabel ||
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`
    });
  } catch {
    res.status(200).json({ address: `${lat.toFixed(5)}, ${lon.toFixed(5)}` });
  }
}
