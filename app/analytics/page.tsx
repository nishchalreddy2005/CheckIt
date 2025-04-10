import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTasks, getTaskStats } from "@/app/actions/task-actions"
import { getCurrentUser } from "@/app/actions/user-actions"
import { ProfileHeader } from "@/components/profile-header"
import { DashboardNav } from "@/components/dashboard-nav"
import { BarChart } from "@/components/bar-chart"
import { PriorityChart } from "@/components/priority-chart"
import { TimelineChart } from "@/components/timeline-chart"
import { TaskRadialVisualization } from "@/components/task-radial-visualization"
import { TaskDashboardVisualization } from "@/components/task-dashboard-visualization"
import { TaskVisualizer } from "@/components/task-visualizer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, LineChart, Activity, CheckCircle, AlertTriangle, TrendingUp, Award, Target } from "lucide-react"

export default async function AnalyticsPage() {
  // Get the current user
  const user = await getCurrentUser()

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login")
  }

  // Fetch tasks from Redis for the current user
  const tasks = await getTasks(user.id)

  // Fetch task stats from Redis for the current user
  const stats = await getTaskStats(user.id)

  // Calculate completion percentage
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  // Calculate productivity score (weighted metric based on completion rate and priority handling)
  const highPriorityCompleted = tasks.filter((t) => t.priority === "high" && t.completed).length
  const highPriorityTotal = tasks.filter((t) => t.priority === "high").length
  const mediumPriorityCompleted = tasks.filter((t) => t.priority === "medium" && t.completed).length
  const mediumPriorityTotal = tasks.filter((t) => t.priority === "medium").length

  // Weight high priority tasks more heavily
  const priorityScore =
    ((highPriorityCompleted / Math.max(highPriorityTotal, 1)) * 0.6 +
      (mediumPriorityCompleted / Math.max(mediumPriorityTotal, 1)) * 0.4) *
    100

  const productivityScore = Math.round(completionPercentage * 0.7 + priorityScore * 0.3)

  // Calculate streak (consecutive days with completed tasks)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  const currentDate = new Date(today)

  // Check up to 30 days back
  for (let i = 0; i < 30; i++) {
    const dateString = currentDate.toISOString().split("T")[0]
    const completedTasksOnDate = tasks.filter((task) => task.completed && task.dueDate === dateString)

    if (completedTasksOnDate.length > 0) {
      streak++
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  // Calculate overdue tasks
  const overdueTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate < today && !task.completed
  })

  // Calculate tasks due today
  const todayTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === today.getTime()
  })

  // Calculate completion rate by day of week
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const completionByDayOfWeek = dayNames.map((day) => {
    const dayIndex = dayNames.indexOf(day)
    const tasksOnDay = tasks.filter((task) => {
      const dueDate = new Date(task.dueDate)
      return dueDate.getDay() === dayIndex
    })

    const completedOnDay = tasksOnDay.filter((task) => task.completed).length
    const totalOnDay = tasksOnDay.length

    return {
      day,
      completed: completedOnDay,
      total: totalOnDay,
      percentage: totalOnDay > 0 ? Math.round((completedOnDay / totalOnDay) * 100) : 0,
    }
  })

  // Find most productive day
  const mostProductiveDay = [...completionByDayOfWeek]
    .filter((day) => day.total > 0)
    .sort((a, b) => b.percentage - a.percentage)[0] || { day: "N/A", percentage: 0 }

  return (
    <div className="flex min-h-screen flex-col">
      <ProfileHeader user={user} />

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
          <DashboardNav />
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8">
          <div className="mx-auto min-w-0">
            <div className="flex flex-col gap-2 mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Comprehensive insights into your productivity and task management</p>
            </div>

            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="overview">
                  <Activity className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <PieChart className="h-4 w-4 mr-2" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <LineChart className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-2">
                          <Target className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="text-3xl font-bold text-blue-700">{completionPercentage}%</div>
                        <p className="text-sm font-medium text-blue-900">Completion Rate</p>
                        <p className="text-xs text-blue-700">
                          {stats.completed} of {stats.total} tasks completed
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 mb-2">
                          <Award className="h-6 w-6 text-purple-700" />
                        </div>
                        <div className="text-3xl font-bold text-purple-700">{productivityScore}</div>
                        <p className="text-sm font-medium text-purple-900">Productivity Score</p>
                        <p className="text-xs text-purple-700">Based on priority & completion</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-2">
                          <CheckCircle className="h-6 w-6 text-green-700" />
                        </div>
                        <div className="text-3xl font-bold text-green-700">{streak}</div>
                        <p className="text-sm font-medium text-green-900">Day Streak</p>
                        <p className="text-xs text-green-700">Consecutive days with completed tasks</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-2">
                          <AlertTriangle className="h-6 w-6 text-amber-700" />
                        </div>
                        <div className="text-3xl font-bold text-amber-700">{overdueTasks.length}</div>
                        <p className="text-sm font-medium text-amber-900">Overdue Tasks</p>
                        <p className="text-xs text-amber-700">{todayTasks.length} tasks due today</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Interactive Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Management Overview</CardTitle>
                    <CardDescription>
                      Interactive visualization of your task categories and completion status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 h-[500px]">
                    <TaskRadialVisualization tasks={tasks} stats={stats} />
                  </CardContent>
                </Card>

                {/* Category and Priority Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Distribution</CardTitle>
                      <CardDescription>Task breakdown by category and completion status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BarChart stats={stats} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Priority Analysis</CardTitle>
                      <CardDescription>Distribution of tasks by priority level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PriorityChart tasks={tasks} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {/* Productivity Score Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Productivity Analysis</CardTitle>
                    <CardDescription>Detailed breakdown of your productivity metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">Productivity Score: {productivityScore}</h3>
                          <p className="text-sm text-muted-foreground">
                            Based on task completion and priority handling
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Overall Completion</span>
                              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">High Priority Handling</span>
                              <span className="text-sm text-muted-foreground">
                                {highPriorityTotal > 0
                                  ? Math.round((highPriorityCompleted / highPriorityTotal) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{
                                  width: `${highPriorityTotal > 0 ? (highPriorityCompleted / highPriorityTotal) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Medium Priority Handling</span>
                              <span className="text-sm text-muted-foreground">
                                {mediumPriorityTotal > 0
                                  ? Math.round((mediumPriorityCompleted / mediumPriorityTotal) * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{
                                  width: `${mediumPriorityTotal > 0 ? (mediumPriorityCompleted / mediumPriorityTotal) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="relative h-48 w-48 mx-auto">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Background circle */}
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />

                            {/* Progress circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="10"
                              strokeDasharray={`${productivityScore * 2.83} 283`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                            />

                            {/* Percentage text */}
                            <text
                              x="50"
                              y="50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="20"
                              fontWeight="bold"
                            >
                              {productivityScore}
                            </text>
                          </svg>
                        </div>

                        <div className="text-center mt-4">
                          <p className="text-sm font-medium">
                            {productivityScore >= 90
                              ? "Exceptional"
                              : productivityScore >= 75
                                ? "Very Good"
                                : productivityScore >= 60
                                  ? "Good"
                                  : productivityScore >= 40
                                    ? "Average"
                                    : "Needs Improvement"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Day of Week Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Day of Week</CardTitle>
                    <CardDescription>Your task completion patterns throughout the week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-7">
                      {completionByDayOfWeek.map((day) => (
                        <div key={day.day} className="flex flex-col items-center">
                          <div className="text-sm font-medium mb-2">{day.day.substring(0, 3)}</div>
                          <div className="relative h-32 w-full flex items-end justify-center">
                            <div
                              className={`w-8 rounded-t-md ${
                                day.percentage >= 75
                                  ? "bg-green-500"
                                  : day.percentage >= 50
                                    ? "bg-blue-500"
                                    : day.percentage >= 25
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                              }`}
                              style={{ height: `${Math.max(day.percentage, 5)}%` }}
                            />
                          </div>
                          <div className="text-xs mt-2">{day.percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {day.completed}/{day.total}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Most Productive Day</h4>
                          <p className="text-sm text-muted-foreground">
                            You complete the most tasks on {mostProductiveDay.day}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{mostProductiveDay.percentage}%</div>
                          <p className="text-sm text-muted-foreground">completion rate</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3D Task Visualization */}
                <Card>
                  <CardHeader>
                    <CardTitle>3D Task Visualization</CardTitle>
                    <CardDescription>Interactive 3D view of your task categories and completion</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <TaskVisualizer taskStats={stats} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                    <CardDescription>Detailed analysis of task categories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TaskDashboardVisualization tasks={tasks} stats={stats} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>7-Day Task Timeline</CardTitle>
                    <CardDescription>Tasks due in the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TimelineChart tasks={tasks} />
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Overdue Tasks</CardTitle>
                      <CardDescription>Tasks that are past their due date</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {overdueTasks.length > 0 ? (
                        <div className="space-y-3">
                          {overdueTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full mr-3 ${
                                    task.priority === "high"
                                      ? "bg-red-500"
                                      : task.priority === "medium"
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                  }`}
                                ></div>
                                <span className="font-medium">{task.title}</span>
                              </div>
                              <div className="text-sm text-red-500">{new Date(task.dueDate).toLocaleDateString()}</div>
                            </div>
                          ))}
                          {overdueTasks.length > 5 && (
                            <div className="text-center text-sm text-muted-foreground pt-2">
                              +{overdueTasks.length - 5} more overdue tasks
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No overdue tasks</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Today's Tasks</CardTitle>
                      <CardDescription>Tasks due today</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {todayTasks.length > 0 ? (
                        <div className="space-y-3">
                          {todayTasks.slice(0, 5).map((task) => (
                            <div key={task.id} className="flex items-center justify-between border-b pb-2">
                              <div className="flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full mr-3 ${
                                    task.priority === "high"
                                      ? "bg-red-500"
                                      : task.priority === "medium"
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                  }`}
                                ></div>
                                <span
                                  className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {task.title}
                                </span>
                              </div>
                              <div className="text-sm">
                                {task.completed ? (
                                  <span className="text-green-500">Completed</span>
                                ) : (
                                  <span className="text-amber-500">Pending</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {todayTasks.length > 5 && (
                            <div className="text-center text-sm text-muted-foreground pt-2">
                              +{todayTasks.length - 5} more tasks due today
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">No tasks due today</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
