export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse the body if it's a string
  let code;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    code = body.code;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();
  console.log(data);
  console.log("STRAVA_CLIENT_ID:", process.env.STRAVA_CLIENT_ID);

  if (data.errors) {
    return res.status(400).json({ error: data.errors[0].message });
  }

  res.status(200).json(data);
}