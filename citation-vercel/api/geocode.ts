const ARCGIS_GEOCODER =
  "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const raw = String(req.query.address || "").trim();
  if (!raw) {
    res.status(400).json({ error: "Enter an address or intersection." });
    return;
  }

  const query = raw.toLowerCase().includes("san diego")
    ? raw
    : `${raw}, San Diego, CA`;

  const params = new URLSearchParams({
    f: "json",
    singleLine: query,
    outFields: "Match_addr,City,Subregion,Region,Postal",
    maxLocations: "1",
    searchExtent: "-117.35,32.50,-116.80,33.20"
  });

  try {
    const response = await fetch(
      `${ARCGIS_GEOCODER}/findAddressCandidates?${params.toString()}`
    );

    if (!response.ok) {
      res.status(502).json({ error: "Address service is unavailable." });
      return;
    }

    const data: any = await response.json();
    const candidate = data?.candidates?.[0];

    if (!candidate?.location) {
      res.status(404).json({ error: "No matching San Diego address was found." });
      return;
    }

    res.status(200).json({
      lat: candidate.location.y,
      lon: candidate.location.x,
      address: candidate.address || query,
      score: Number(candidate.score || 0)
    });
  } catch {
    res.status(502).json({ error: "Address service is unavailable." });
  }
}
