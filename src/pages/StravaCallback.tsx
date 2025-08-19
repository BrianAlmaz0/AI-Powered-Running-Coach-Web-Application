import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const StravaCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("No code found in URL.");
      return;
    }

    fetch("/api/strava-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to connect to Strava.");
        }
        return res.json();
      })
      .then(async (data) => {
        if (!user?.id) {
          setError("User not authenticated.");
          return;
        }
        // Update the profile in Supabase
        const { error } = await supabase
          .from("profiles")
          .update({
            strava_user_id: data.athlete.id,
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token,
            strava_token_expires_at: data.expires_at,
          })
          .eq("user_id", user.id);

        if (error) {
          console.error("Supabase update error:", error); // <-- Add this line
          setError("Failed to update profile in Supabase.");
        return;
      }

        navigate("/dashboard");
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [navigate, user]);

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>;
  }

  return <div className="text-center mt-8">Connecting to Strava...</div>;
};

export default StravaCallback;