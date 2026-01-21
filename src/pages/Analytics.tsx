import { useState, useEffect } from "react";
import { analyticsService } from "@/api/analyticsService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Save,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Table as TableIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AnalyticsStats {
  generated: number;
  saved: number;
  exported: number;
}

interface DailyData {
  date: string;
  event_type: string;
  count: string;
}

interface TripData {
  event_type: "generated" | "saved" | "exported";
  trip_destination: string;
  trip_days: number;
  trip_budget: number;
  creator_name: string;
  created_at: string;
}

interface AnalyticsData {
  success: boolean;
  period: string;
  stats: AnalyticsStats;
  total: number;
  daily: DailyData[];
  trips: TripData[];
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const result = await analyticsService.getAnalytics(period);
      if (result) {
        setData(result);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [period]);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );

  const processChartData = () => {
    if (!data) return [];

    // Group by date
    const dailyMap = new Map<
      string,
      { generated: number; saved: number; exported: number }
    >();

    data.daily.forEach((entry) => {
      if (!dailyMap.has(entry.date)) {
        dailyMap.set(entry.date, { generated: 0, saved: 0, exported: 0 });
      }
      const dayData = dailyMap.get(entry.date)!;
      dayData[entry.event_type as keyof typeof dayData] = parseInt(entry.count);
    });

    // Convert to array and sort by date (most recent first, but we'll reverse for display)
    return Array.from(dailyMap.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 14 days for the chart
  };

  const chartData = processChartData();

  const chartConfig = {
    generated: {
      label: "Generated",
      color: "hsl(270, 70%, 60%)",
    },
    saved: {
      label: "Saved",
      color: "hsl(142, 70%, 50%)",
    },
    exported: {
      label: "Exported",
      color: "hsl(25, 95%, 53%)",
    },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Planner
              </Button>
            </Link>
          </div>
          <h1 className="text-5xl font-light tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your travel planning activity and insights
          </p>
        </header>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="trips">Trip Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Period Selector */}
            <div className="flex gap-2">
              <Button
                variant={period === 7 ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(7)}
              >
                Last 7 Days
              </Button>
              <Button
                variant={period === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(30)}
              >
                Last 30 Days
              </Button>
              <Button
                variant={period === 90 ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(90)}
              >
                Last 90 Days
              </Button>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Events"
                  value={data.total}
                  icon={BarChart3}
                  color="text-blue-500"
                />
                <StatCard
                  title="Trips Generated"
                  value={data.stats.generated}
                  icon={Sparkles}
                  color="text-purple-500"
                />
                <StatCard
                  title="Trips Saved"
                  value={data.stats.saved}
                  icon={Save}
                  color="text-green-500"
                />
                <StatCard
                  title="Trips Exported"
                  value={data.stats.exported}
                  icon={Download}
                  color="text-orange-500"
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">
                  Failed to load analytics data
                </p>
              </div>
            )}

            {/* Chart */}
            {loading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[350px] w-full" />
                </CardContent>
              </Card>
            ) : data && chartData.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Over Time</CardTitle>
                  <CardDescription>
                    Daily breakdown of trip planning activity (last{" "}
                    {chartData.length} days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[350px] w-full"
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-slate-200 dark:stroke-slate-800"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                      <Bar
                        dataKey="generated"
                        stackId="a"
                        fill="var(--color-generated)"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="saved"
                        stackId="a"
                        fill="var(--color-saved)"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="exported"
                        stackId="a"
                        fill="var(--color-exported)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {loading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : data ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Engagement Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Conversion Rate (Saved/Generated)
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          {data.stats.generated > 0
                            ? (
                                (data.stats.saved / data.stats.generated) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              data.stats.generated > 0
                                ? (data.stats.saved / data.stats.generated) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Export Rate (Exported/Saved)
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          {data.stats.saved > 0
                            ? (
                                (data.stats.exported / data.stats.saved) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              data.stats.saved > 0
                                ? (data.stats.exported / data.stats.saved) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Period Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Period
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {data.period}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Avg. Daily Events
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {(data.total / period).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Most Active Day
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        {chartData.length > 0
                          ? (() => {
                              const mostActive = chartData.reduce(
                                (max, day) => {
                                  const total =
                                    day.generated + day.saved + day.exported;
                                  const maxTotal =
                                    max.generated + max.saved + max.exported;
                                  return total > maxTotal ? day : max;
                                },
                              );
                              return new Date(
                                mostActive.date,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              });
                            })()
                          : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : data?.trips ? (
              <>
                {(["generated", "saved", "exported"] as const).map((eventType) => {
                  const filteredTrips = data.trips.filter(
                    (trip) => trip.event_type === eventType
                  );

                  if (filteredTrips.length === 0) return null;

                  return (
                    <Card key={eventType}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          {eventType === "generated" && (
                            <Sparkles className="h-5 w-5 text-purple-500" />
                          )}
                          {eventType === "saved" && (
                            <Save className="h-5 w-5 text-green-500" />
                          )}
                          {eventType === "exported" && (
                            <Download className="h-5 w-5 text-orange-500" />
                          )}
                          {eventType} Trips
                        </CardTitle>
                        <CardDescription>
                          {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""} in
                          the selected period
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Destination</TableHead>
                                <TableHead className="text-center">Days</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead>Creator</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTrips.map((trip, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {trip.trip_destination}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {trip.trip_days}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    ${trip.trip_budget.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-slate-600 dark:text-slate-400">
                                    {trip.creator_name}
                                  </TableCell>
                                  <TableCell className="text-right text-slate-600 dark:text-slate-400">
                                    {new Date(trip.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-12">
                <TableIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No trip data available
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Sparkles className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm">
                Crafted with passion for travelers worldwide
              </span>
            </div>

            <a
              href="https://illuminext.my"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors duration-200"
            >
              <span className="text-sm">Built by</span>
              <span className="font-bold">Illuminext Solutions</span>
              <ExternalLink className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Illuminext Solutions. Making travel
            planning effortless.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Analytics;
