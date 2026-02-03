import supabase from './supabase';

// Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalSessions: number;
  avgSessionDuration: number;
  totalGamesPlayed: number;
  newUsersToday: number;
  revenueToday: number;
}

export interface UserStats {
  id: string;
  deviceId: string;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  totalRevenue: number;
  platform: string;
  country: string;
  isPremium: boolean;
}

export interface RevenueData {
  date: string;
  revenue: number;
  purchases: number;
  subscriptions: number;
}

export interface ChartData {
  labels: string[];
  data: number[];
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true });

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: activeUsers } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', sevenDaysAgo.toISOString());

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('analytics_users')
      .select('total_revenue');
    const totalRevenue = revenueData?.reduce((sum, u) => sum + (u.total_revenue || 0), 0) || 0;

    // Get session count
    const { count: totalSessions } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'session_start');

    // Get games played
    const { count: totalGamesPlayed } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'game_start');

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .gte('first_seen', today.toISOString());

    // Get revenue today
    const { data: todayRevenue } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'purchase')
      .gte('timestamp', today.toISOString());
    const revenueToday = todayRevenue?.reduce((sum, e) => sum + (e.event_data?.revenue || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalRevenue,
      totalSessions: totalSessions || 0,
      avgSessionDuration: 0, // Would need to calculate from session events
      totalGamesPlayed: totalGamesPlayed || 0,
      newUsersToday: newUsersToday || 0,
      revenueToday,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalRevenue: 0,
      totalSessions: 0,
      avgSessionDuration: 0,
      totalGamesPlayed: 0,
      newUsersToday: 0,
      revenueToday: 0,
    };
  }
}

// Fetch daily active users for chart
export async function fetchDAUChart(days: number = 30): Promise<ChartData> {
  const labels: string[] = [];
  const data: number[] = [];

  try {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const { count } = await supabase
        .from('analytics_events')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_type', 'session_start')
        .gte('timestamp', date.toISOString())
        .lt('timestamp', nextDay.toISOString());

      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(count || 0);
    }
  } catch (error) {
    console.error('Error fetching DAU chart:', error);
  }

  return { labels, data };
}

// Fetch revenue chart
export async function fetchRevenueChart(days: number = 30): Promise<ChartData> {
  const labels: string[] = [];
  const data: number[] = [];

  try {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const { data: purchases } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'purchase')
        .gte('timestamp', date.toISOString())
        .lt('timestamp', nextDay.toISOString());

      const dayRevenue = purchases?.reduce((sum, p) => sum + (p.event_data?.revenue || 0), 0) || 0;

      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(dayRevenue);
    }
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
  }

  return { labels, data };
}

// Fetch users list
export async function fetchUsers(page: number = 0, limit: number = 50): Promise<UserStats[]> {
  try {
    const { data, error } = await supabase
      .from('analytics_users')
      .select('*')
      .order('last_seen', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;

    return data?.map(u => ({
      id: u.id,
      deviceId: u.device_id,
      firstSeen: u.first_seen,
      lastSeen: u.last_seen,
      totalSessions: u.total_sessions,
      totalRevenue: u.total_revenue,
      platform: u.platform,
      country: u.country || 'Unknown',
      isPremium: u.is_premium,
    })) || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Fetch platform distribution
export async function fetchPlatformDistribution(): Promise<{ ios: number; android: number }> {
  try {
    const { count: ios } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'ios');

    const { count: android } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .eq('platform', 'android');

    return { ios: ios || 0, android: android || 0 };
  } catch (error) {
    console.error('Error fetching platform distribution:', error);
    return { ios: 0, android: 0 };
  }
}

// Generate investor report data
export async function generateInvestorReport(startDate: Date, endDate: Date) {
  try {
    const stats = await fetchDashboardStats();
    const dauChart = await fetchDAUChart(30);
    const revenueChart = await fetchRevenueChart(30);
    const platformDist = await fetchPlatformDistribution();

    // Get retention data
    const { count: day1Retention } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .gte('total_sessions', 2);

    const { count: day7Retention } = await supabase
      .from('analytics_users')
      .select('*', { count: 'exact', head: true })
      .gte('total_sessions', 7);

    return {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      keyMetrics: {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        totalRevenue: stats.totalRevenue,
        averageRevenuePerUser: stats.totalUsers > 0 ? stats.totalRevenue / stats.totalUsers : 0,
        totalGamesPlayed: stats.totalGamesPlayed,
        avgSessionsPerUser: stats.totalUsers > 0 ? stats.totalSessions / stats.totalUsers : 0,
      },
      retention: {
        day1: stats.totalUsers > 0 ? ((day1Retention || 0) / stats.totalUsers * 100).toFixed(1) : 0,
        day7: stats.totalUsers > 0 ? ((day7Retention || 0) / stats.totalUsers * 100).toFixed(1) : 0,
      },
      platformDistribution: platformDist,
      charts: {
        dau: dauChart,
        revenue: revenueChart,
      },
    };
  } catch (error) {
    console.error('Error generating investor report:', error);
    throw error;
  }
}
