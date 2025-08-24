import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Calendar, Target, TrendingUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parse, getDay, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { getValidStravaAccessToken } from "@/utils/strava-token";


interface Profile {
  display_name: string | null;
  strava_user_id: string | null;
  strava_access_token?: string | null;
  strava_refresh_token?: string | null;
  strava_token_expires_at?: number | null;
  fitness_level: string;
  weekly_mileage_goal: number;
}

interface DashboardStats {
  totalRuns: number;
  totalDistance: number;
  averagePace: number;
  weeklyGoalProgress: number;
}
interface DayPlan {
  date: string;     
  workout: string; 
}

function getDayColor(workout: string) {
  if (/easy/i.test(workout)) return "bg-green-200";
  if (/interval|speed/i.test(workout)) return "bg-red-200";
  if (/long/i.test(workout)) return "bg-blue-200";
  if (/rest/i.test(workout)) return "bg-gray-200";
  return "bg-yellow-100";
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
  
    totalRuns: 0,
    totalDistance: 0,
    averagePace: 0,
    weeklyGoalProgress: 0
  });
  const [raceType, setRaceType] = useState("");
  const [goalTime, setGoalTime] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [runsPerWeek, setRunsPerWeek] = useState(3);
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);

  const handleGoalSubmit = async (e: React.FormEvent) => {
  console.log("Submitting goal"); // for debugging

  e.preventDefault();
  setLoading(true);

  try {
    // Send user inputs and recent activities to your AI API route
    const res = await fetch("/api/ai-generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raceType,
        goalTime,
        raceDate,
        runsPerWeek,
        activities, // send all recent activities
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to generate plan.");
    }

    const { weeklyGoal, plan, message } = await res.json();
    setPlan(plan);
    console.log("plan:", plan);

    // Save the weekly goal to Supabase
    await supabase
      .from("profiles")
      .update({ weekly_mileage_goal: weeklyGoal })
      .eq("user_id", user.id);

    setProfile((p) => p && { ...p, weekly_mileage_goal: weeklyGoal });

    toast({
      title: "Training Plan Generated!",
      description: message || `Your weekly goal is ${weeklyGoal} mi.`,
      variant: "default",
    });

    // Optionally, display the plan to the user here
    // setPlan(plan);

  } catch (error: any) {
    toast({
      title: "Error generating plan",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  const [loading, setLoading] = useState(true);

  const syncActivities = async () => {
  setSyncing(true);

  try {
    const accessToken = await getValidStravaAccessToken(profile, user.id);
    if (!accessToken) {
      toast({
        title: "Strava connection expired",
        description: "Please reconnect your Strava account.",
        variant: "destructive"
      });
      setSyncing(false);
      return;
    }

    // Proceed to fetch activities with accessToken
    const activitiesRes = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=10",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const activitiesData = await activitiesRes.json();

    if (!Array.isArray(activitiesData)) {
      throw new Error("Failed to fetch activities from Strava.");
    }

    setActivities(activitiesData);

    toast({
      title: "Activities Synced!",
      description: `Fetched ${activitiesData.length} activities from Strava.`,
      variant: "default"
    });
  } catch (error: any) {
    toast({
      title: "Failed to sync activities",
      description: error.message || String(error),
      variant: "destructive"
    });
  } finally {
    setSyncing(false);
  }
};

  useEffect(() => {
  if (
    profile?.strava_user_id &&
    profile?.strava_access_token &&
    profile?.strava_refresh_token &&
    profile?.strava_token_expires_at
  ) {
    setStravaConnected(true);
  } else {
    setStravaConnected(false);
  }
}, [profile]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data && user) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: user.id,
            display_name: user.user_metadata?.display_name || null,
            fitness_level: 'beginner',
            weekly_mileage_goal: 20
          }]);

        if (!insertError) {
          setProfile({
            display_name: user.user_metadata?.display_name || null,
            strava_user_id: null,
            fitness_level: 'beginner',
            weekly_mileage_goal: 20
          });
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user?.id);

      if (activities) {
        const totalRuns = activities.length;
        const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1609.34; // Convert to miles
        const averagePace = activities.length > 0 
          ? activities.reduce((sum, activity) => {
              const pace = activity.moving_time / (activity.distance / 1609.34); // seconds per mile
              return sum + pace;
            }, 0) / activities.length / 60 // Convert to minutes per mile
          : 0;

        setStats({
          totalRuns,
          totalDistance,
          averagePace,
          weeklyGoalProgress: 0 // Will be calculated based on current week
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
  if (user?.id) {
    fetchProfile();
    fetchStats();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as first day
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const runsThisWeek = activities.filter((activity) => {
  const activityDate = typeof activity.start_date === "string"
    ? parseISO(activity.start_date)
    : new Date(activity.start_date);
  return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
  }).length;

  const distanceThisWeek = activities
  .filter((activity) => {
    const activityDate = typeof activity.start_date === "string"
      ? parseISO(activity.start_date)
      : new Date(activity.start_date);
    return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
  })
  .reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1609.34; // miles

  // Get activities for this week using your existing logic
  const activitiesThisWeek = activities.filter((activity) => {
  const activityDate = typeof activity.start_date === "string"
    ? parseISO(activity.start_date)
    : new Date(activity.start_date);
  return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
});

  // Calculate average pace for this week in min/mi
  const averagePaceThisWeek =
  activitiesThisWeek.length > 0
    ? activitiesThisWeek.reduce((sum, activity) => {
        const miles = (activity.distance || 0) / 1609.34;
        return sum + (miles > 0 ? activity.moving_time / 60 / miles : 0);
      }, 0) / activitiesThisWeek.length
    : 0;

  const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const REDIRECT_URI = "http://localhost:3000/strava-callback";
  const SCOPE = "activity:read_all";

  // Add this function inside your component file
  const connectStrava = () => {
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&approval_prompt=auto&scope=${SCOPE}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">AI Running Coach</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.display_name || user?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Runs This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runsThisWeek}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distance This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{distanceThisWeek.toFixed(1)} mi</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pace This Week</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averagePaceThisWeek > 0
                  ? `${Math.floor(averagePaceThisWeek)}:${String(Math.round((averagePaceThisWeek % 1) * 60)).padStart(2, '0')}`
                  : '--:--'}
              </div>
              <p className="text-xs text-muted-foreground">min/mi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {profile?.weekly_mileage_goal
                  ? `${profile.weekly_mileage_goal} mi`
                  : <span className="text-muted-foreground">Set your goal below</span>
                  }
              </div>
              <p className="text-xs text-muted-foreground">Target distance</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          {/* Goal Setting Form */}
            <Card>
              <CardHeader>
                <CardTitle>Set Your Training Goal With AI</CardTitle>
                <CardDescription>
                  Tell us about your race and goals to get a personalized weekly mileage target.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div>
                    <label>Race Distance </label>
                    <select value={raceType} onChange={e => setRaceType(e.target.value)}>
                      <option value="">Select</option>
                      <option value="5k">5K</option>
                      <option value="10k">10K</option>
                      <option value="half">Half Marathon</option>
                      <option value="full">Marathon</option>
                    </select>
                  </div>
                  <div>
                    <label>Goal Time (hh:mm:ss) </label>
                    <input type="text" value={goalTime} onChange={e => setGoalTime(e.target.value)} />
                  </div>
                  <div>
                    <label>Race Date  </label>
                    <input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} />
                  </div>
                  <div>
                    <label>Runs per week  </label>
                    <input type="number" min={1} max={14} value={runsPerWeek} onChange={e => setRunsPerWeek(Number(e.target.value))} />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoalSubmit}
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate Training Plan"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Strava Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Connect with Strava</CardTitle>
              <CardDescription>
                Import your running data automatically from Strava to get personalized AI coaching.
              </CardDescription>
            </CardHeader>
            <CardContent>
            {!stravaConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Strava account to automatically sync your runs and get AI-powered insights.
                </p>
                <Button onClick={connectStrava} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Strava Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-success">
                  ✓ Connected to Strava
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={syncActivities}
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Sync Latest Activities"}
                </Button>
              </div>
            )}
          </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI Coaching Insights</CardTitle>
              <CardDescription>
                Personalized training recommendations based on your running data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan && plan.length > 0 ? (
                  <div>
                    <div className="mb-4 text-sm font-medium">Your AI Training Plan</div>
                    <div className="grid grid-cols-7 gap-2">
                      {plan.map((day) => (
                        <div
                          key={day.date}
                          className={`rounded p-2 cursor-pointer text-center transition-all duration-200 ${getDayColor(day.workout)} ${selectedDay?.date === day.date ? "scale-110 z-10 shadow-lg" : ""}`}
                          onClick={() => setSelectedDay(day)}
                        >
                          <div className="font-bold">{new Date(day.date).getDate()}</div>
                          <div className="text-xs truncate">{day.workout.split(",")[0]}</div>
                        </div>
                      ))}
                    </div>
                    {selectedDay && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative animate-zoomIn">
                        <button
                          className="absolute top-2 right-2 text-gray-500"
                          onClick={() => setSelectedDay(null)}
                        >
                          Close
                        </button>
                        <h2 className="text-xl font-bold mb-2">{selectedDay.workout}</h2>
                        <p className="mb-2">Date: {new Date(selectedDay.date).toLocaleDateString()}</p>
                        {/* Add more details here, e.g., pace, notes, hydration tips */}
                        <div className="mt-4">
                          <label>
                            <input type="checkbox" /> Mark as complete
                          </label>
                        </div>
                        <div className="mt-4">
                          <div className="h-2 bg-gray-200 rounded">
                            <div className="h-2 bg-blue-500 rounded" style={{ width: "60%" }} />
                          </div>
                          <div className="text-xs text-right mt-1">Weekly Progress: 60%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                ) : stats.totalRuns === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Connect your Strava account and complete some runs to receive AI-powered coaching insights!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Next Training Focus</p>
                      <p className="text-sm text-muted-foreground">
                        Based on your recent activity, focus on building your aerobic base with easy runs.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGoalSubmit}
                      disabled={loading}
                    >
                      {loading ? "Generating..." : "Generate Training Plan"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Your latest running activities and performance data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No activities yet</p>
                  <p className="text-sm text-muted-foreground">
                    Connect your Strava account to start tracking your runs and getting AI coaching insights.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-muted-foreground/10">
                  {activities.map((activity) => (
                    <li key={activity.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{activity.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(activity.start_date).toLocaleDateString()} • {((activity.distance || 0) / 1609.34).toFixed(2)} mi
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.moving_time
                            ? `${Math.floor(activity.moving_time / 60)}:${String(activity.moving_time % 60).padStart(2, "0")}`
                            : "--:--"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;