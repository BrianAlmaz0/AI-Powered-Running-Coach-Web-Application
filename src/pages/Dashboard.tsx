import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Calendar, Target, TrendingUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);

  const syncActivities = async () => {
  if (!profile?.strava_access_token) {
    toast({
      title: "No Strava access token found.",
      description: "Please reconnect your Strava account.",
      variant: "destructive"
    });
    return;
  }
  setSyncing(true);
  try {
    const res = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=10",
      {
        headers: {
          Authorization: `Bearer ${profile.strava_access_token}`,
        },
      }
    );
    const data = await res.json();
    setActivities(data);
    toast({
      title: "Activities Synced!",
      description: `Fetched ${data.length} activities from Strava.`,
      variant: "default"
    });
  } catch (error) {
    toast({
      title: "Failed to sync activities",
      description: String(error),
      variant: "destructive"
    });
  } finally {
    setSyncing(false);
  }
};

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

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
        const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0) / 1000; // Convert to km
        const averagePace = activities.length > 0 
          ? activities.reduce((sum, activity) => {
              const pace = activity.moving_time / (activity.distance / 1000); // seconds per km
              return sum + pace;
            }, 0) / activities.length / 60 // Convert to minutes per km
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
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRuns}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDistance.toFixed(1)} km</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Pace</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averagePace > 0 ? `${Math.floor(stats.averagePace)}:${String(Math.floor((stats.averagePace % 1) * 60)).padStart(2, '0')}` : '--:--'}
              </div>
              <p className="text-xs text-muted-foreground">min/km</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.weekly_mileage_goal || 0} km</div>
              <p className="text-xs text-muted-foreground">Target distance</p>
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
              {!profile?.strava_user_id ? (
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
                  <Button variant="outline" 
                    className="w-full"
                    onClick ={syncActivities}
                    disabled={syncing}
                  >
                    {syncing ? "Syncing..." : "Sync Latest Activities"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Coaching */}
          <Card>
            <CardHeader>
              <CardTitle>AI Coaching Insights</CardTitle>
              <CardDescription>
                Personalized training recommendations based on your running data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.totalRuns === 0 ? (
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
                    <Button variant="outline" className="w-full">
                      Generate Training Plan
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
                            {new Date(activity.start_date).toLocaleDateString()} • {((activity.distance || 0) / 1000).toFixed(2)} km
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