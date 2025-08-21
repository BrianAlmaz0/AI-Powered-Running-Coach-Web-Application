import { supabase } from "../src/integrations/supabase/client";
/**
 * Refreshes the Strava access token if expired.
 * If refresh fails, clears Strava fields in Supabase and returns null.
 * @param {object} profile - The user's profile object from Supabase.
 * @param {string} userId - The user's Supabase user ID.
 * @returns {Promise<string|null>} - The valid access token, or null if refresh failed.
 */
export async function getValidStravaAccessToken(profile, userId) {
  let accessToken = profile.strava_access_token;
  let refreshToken = profile.strava_refresh_token;
  let expiresAt = profile.strava_token_expires_at;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt < now) {
    // Token expired, try to refresh
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
        client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await res.json();

    if (data.errors || !data.access_token) {
      // Clear Strava fields in Supabase
      await supabase
        .from("profiles")
        .update({
          strava_user_id: null,
          strava_access_token: null,
          strava_refresh_token: null,
          strava_token_expires_at: null,
        })
        .eq("user_id", userId);

      // Optionally: return an error or null
      return null;
    }

    // Update Supabase with new tokens
    await supabase
      .from("profiles")
      .update({
        strava_access_token: data.access_token,
        strava_refresh_token: data.refresh_token,
        strava_token_expires_at: data.expires_at,
      })
      .eq("user_id", userId);

    accessToken = data.access_token;
  }

  return accessToken;
}