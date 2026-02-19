import { useEffect, useState } from 'react';
import { dashboardService, type DashboardStats, type RentStatus, type EarningSummaryItem, type BookingsOverviewItem } from '@/api/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Users, Car, DollarSign, Calendar } from 'lucide-react';
import { ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rentStatus, setRentStatus] = useState<RentStatus | null>(null);
  const [earningSummary, setEarningSummary] = useState<EarningSummaryItem[]>([]);
  const [bookingsOverview, setBookingsOverview] = useState<BookingsOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [rentPeriod, setRentPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [earningMonths, setEarningMonths] = useState(8);
  const [bookingsYear, setBookingsYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchRentStatus();
  }, [rentPeriod]);

  useEffect(() => {
    fetchEarningSummary();
  }, [earningMonths]);

  useEffect(() => {
    fetchBookingsOverview();
  }, [bookingsYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, rentData, earningData, bookingsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRentStatus(rentPeriod),
        dashboardService.getEarningSummary(earningMonths),
        dashboardService.getBookingsOverview(bookingsYear),
      ]);

      setStats(statsData);
      setRentStatus(rentData);
      setEarningSummary(earningData);
      setBookingsOverview(bookingsData);
      
      // Debug: Log the bookings data
      console.log('Bookings Overview Data:', bookingsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRentStatus = async () => {
    try {
      const data = await dashboardService.getRentStatus(rentPeriod);
      setRentStatus(data);
    } catch (error) {
      console.error('Failed to fetch rent status:', error);
    }
  };

  const fetchEarningSummary = async () => {
    try {
      const data = await dashboardService.getEarningSummary(earningMonths);
      setEarningSummary(data);
    } catch (error) {
      console.error('Failed to fetch earning summary:', error);
    }
  };

  const fetchBookingsOverview = async () => {
    try {
      const data = await dashboardService.getBookingsOverview(bookingsYear);
      console.log('Fetched Bookings Overview:', data);
      setBookingsOverview(data);
    } catch (error) {
      console.error('Failed to fetch bookings overview:', error);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // Prepare pie chart data
  const pieData = rentStatus
    ? [
        { name: 'Complete', value: rentStatus.complete, color: '#64748b' },
        { name: 'Pending', value: rentStatus.pending, color: '#0ea5e9' },
        { name: 'Cancelled', value: rentStatus.cancelled, color: '#e2e8f0' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <h3 className="mt-2 text-2xl font-bold">{stats?.totalBookings.value || 0}</h3>
                <div className="mt-1 flex items-center text-sm">
                  {stats && stats.totalBookings.change >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-green-600">+{stats.totalBookings.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                      <span className="text-red-600">{stats?.totalBookings.change}%</span>
                    </>
                  )}
                  <span className="ml-1 text-muted-foreground">from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Units</p>
                <h3 className="mt-2 text-2xl font-bold">{stats?.activeVehicles.value || 0}</h3>
                <div className="mt-1 flex items-center text-sm">
                  {stats && stats.activeVehicles.change >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-green-600">+{stats.activeVehicles.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                      <span className="text-red-600">{stats?.activeVehicles.change}%</span>
                    </>
                  )}
                  <span className="ml-1 text-muted-foreground">from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <h3 className="mt-2 text-2xl font-bold">{stats?.totalClients.value || 0}</h3>
                <div className="mt-1 flex items-center text-sm">
                  {stats && stats.totalClients.change >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-green-600">+{stats.totalClients.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                      <span className="text-red-600">{stats?.totalClients.change}%</span>
                    </>
                  )}
                  <span className="ml-1 text-muted-foreground">from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <h3 className="mt-2 text-2xl font-bold">{formatCurrency(stats?.revenue.value || 0)}</h3>
                <div className="mt-1 flex items-center text-sm">
                  {stats && stats.revenue.change >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                      <span className="text-green-600">+{stats.revenue.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                      <span className="text-red-600">{stats?.revenue.change}%</span>
                    </>
                  )}
                  <span className="ml-1 text-muted-foreground">from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rent Status Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Rent Status</CardTitle>
              <Select value={rentPeriod} onValueChange={(value: any) => setRentPeriod(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    cornerRadius="25%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[#64748b]" />
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[#0ea5e9]" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[#e2e8f0]" />
                <span className="text-sm text-muted-foreground">Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earning Summary Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Earning Summary</CardTitle>
              <Select value={earningMonths.toString()} onValueChange={(value) => setEarningMonths(parseInt(value))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="8">Last 8 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningSummary}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].payload.month}
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Bookings Overview</CardTitle>
            <Select value={bookingsYear.toString()} onValueChange={(value) => setBookingsYear(parseInt(value))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                  {new Date().getFullYear() - 1}
                </SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>
                  This Year
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].payload.month} {bookingsYear}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  fill="#64748b"
                  activeBar={{ fill: '#0ea5e9' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
