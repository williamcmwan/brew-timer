import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Coffee, TrendingUp, Star, Award } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F4A460", "#FFE4B5"];

export default function Analytics() {
  const navigate = useNavigate();
  const { brews, coffeeBeans } = useApp();

  // Calculate statistics
  const stats = useMemo(() => {
    if (brews.length === 0) {
      return {
        totalBrews: 0,
        avgRating: 0,
        avgEY: 0,
        avgTDS: 0,
      };
    }

    const totalRating = brews.reduce((sum, brew) => sum + (brew.rating || 0), 0);
    const totalEY = brews.reduce((sum, brew) => sum + (brew.extractionYield || 0), 0);
    const totalTDS = brews.reduce((sum, brew) => sum + (brew.tds || 0), 0);

    return {
      totalBrews: brews.length,
      avgRating: (totalRating / brews.length).toFixed(1),
      avgEY: (totalEY / brews.length).toFixed(2),
      avgTDS: (totalTDS / brews.length).toFixed(2),
    };
  }, [brews]);

  // Favorite beans (most brewed)
  const favoriteBeansData = useMemo(() => {
    const beanCounts = brews.reduce((acc, brew) => {
      const beanId = brew.coffeeBeanId;
      acc[beanId] = (acc[beanId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(beanCounts)
      .map(([beanId, count]) => {
        const bean = coffeeBeans.find(b => b.id === beanId);
        return {
          name: bean ? bean.name : "Unknown",
          count,
          beanId,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [brews, coffeeBeans]);

  // Extraction yield trend over time
  const eyTrendData = useMemo(() => {
    return brews
      .filter(brew => brew.extractionYield)
      .map(brew => ({
        date: new Date(brew.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ey: brew.extractionYield,
        tds: brew.tds || 0,
        timestamp: new Date(brew.date).getTime(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-20); // Last 20 brews
  }, [brews]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} ★`,
      count: brews.filter(brew => brew.rating === rating).length,
    }));
    return distribution;
  }, [brews]);

  // Brews by coffee bean for pie chart
  const brewsByBean = useMemo(() => {
    const beanCounts = brews.reduce((acc, brew) => {
      const beanId = brew.coffeeBeanId;
      acc[beanId] = (acc[beanId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(beanCounts)
      .map(([beanId, count]) => {
        const bean = coffeeBeans.find(b => b.id === beanId);
        return {
          name: bean ? bean.name.substring(0, 15) : "Unknown",
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [brews, coffeeBeans]);

  if (brews.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-background p-4">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card className="border-espresso/20">
            <CardContent className="py-12 text-center">
              <Coffee className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Brew Data Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start logging your brews to see insights and analytics!
              </p>
              <Button onClick={() => navigate("/brew")}>
                Log Your First Brew
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-background p-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-espresso mb-2">Brew Analytics</h1>
          <p className="text-muted-foreground">Insights from your brewing journey</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-espresso/20">
            <CardHeader className="pb-2">
              <CardDescription>Total Brews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-espresso" />
                <span className="text-3xl font-bold text-espresso">{stats.totalBrews}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-espresso/20">
            <CardHeader className="pb-2">
              <CardDescription>Avg Rating</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-golden fill-golden" />
                <span className="text-3xl font-bold text-espresso">{stats.avgRating}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-espresso/20">
            <CardHeader className="pb-2">
              <CardDescription>Avg Extraction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-espresso" />
                <span className="text-3xl font-bold text-espresso">{stats.avgEY}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-espresso/20">
            <CardHeader className="pb-2">
              <CardDescription>Avg TDS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-espresso" />
                <span className="text-3xl font-bold text-espresso">{stats.avgTDS}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Favorite Beans */}
        <Card className="border-espresso/20 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-golden" />
              Your Favorite Beans
            </CardTitle>
            <CardDescription>Most frequently brewed coffees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {favoriteBeansData.map((bean, index) => (
                <div key={bean.beanId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-espresso text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{bean.name}</span>
                  </div>
                  <span className="text-muted-foreground">{bean.count} brews</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Extraction Yield Trend */}
          <Card className="border-espresso/20">
            <CardHeader>
              <CardTitle>Extraction Yield Trend</CardTitle>
              <CardDescription>Your last 20 brews</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ey" 
                    stroke="#8B4513" 
                    strokeWidth={2}
                    name="Extraction Yield (%)"
                    dot={{ fill: "#8B4513" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tds" 
                    stroke="#D2691E" 
                    strokeWidth={2}
                    name="TDS (%)"
                    dot={{ fill: "#D2691E" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="border-espresso/20">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>How you rate your brews</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="rating" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8B4513" 
                    radius={[8, 8, 0, 0]}
                    name="Number of Brews"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Brews by Bean - Pie Chart */}
        <Card className="border-espresso/20">
          <CardHeader>
            <CardTitle>Brews by Coffee Bean</CardTitle>
            <CardDescription>Distribution of your brews across different beans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={brewsByBean}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {brewsByBean.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
