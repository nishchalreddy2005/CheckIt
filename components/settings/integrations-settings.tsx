"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Slack, Trello, ChromeIcon as Google } from "lucide-react"
import type { User } from "@/lib/types"

export function IntegrationsSettings({ user }: { user: User }) {
  const [googleConnected, setGoogleConnected] = useState(false)
  const [slackConnected, setSlackConnected] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [trelloConnected, setTrelloConnected] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Google className="mr-2 h-5 w-5" />
                Google Calendar
              </CardTitle>
              <Switch checked={googleConnected} onCheckedChange={setGoogleConnected} />
            </div>
            <CardDescription>Sync your tasks with Google Calendar</CardDescription>
          </CardHeader>
          <CardFooter>
            {googleConnected ? (
              <Button variant="outline" size="sm" onClick={() => setGoogleConnected(false)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => setGoogleConnected(true)}>
                Connect
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Slack className="mr-2 h-5 w-5" />
                Slack
              </CardTitle>
              <Switch checked={slackConnected} onCheckedChange={setSlackConnected} />
            </div>
            <CardDescription>Get task notifications in Slack</CardDescription>
          </CardHeader>
          <CardFooter>
            {slackConnected ? (
              <Button variant="outline" size="sm" onClick={() => setSlackConnected(false)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => setSlackConnected(true)}>
                Connect
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </CardTitle>
              <Switch checked={githubConnected} onCheckedChange={setGithubConnected} />
            </div>
            <CardDescription>Link tasks to GitHub issues</CardDescription>
          </CardHeader>
          <CardFooter>
            {githubConnected ? (
              <Button variant="outline" size="sm" onClick={() => setGithubConnected(false)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => setGithubConnected(true)}>
                Connect
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Trello className="mr-2 h-5 w-5" />
                Trello
              </CardTitle>
              <Switch checked={trelloConnected} onCheckedChange={setTrelloConnected} />
            </div>
            <CardDescription>Sync your tasks with Trello boards</CardDescription>
          </CardHeader>
          <CardFooter>
            {trelloConnected ? (
              <Button variant="outline" size="sm" onClick={() => setTrelloConnected(false)}>
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={() => setTrelloConnected(true)}>
                Connect
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">API Access</h3>
        <p className="text-sm text-muted-foreground">
          Generate an API key to access your CheckIt data programmatically.
        </p>
        <div className="flex space-x-4">
          <Input value="••••••••••••••••••••••••••••••" readOnly className="font-mono" />
          <Button>Generate New Key</Button>
        </div>
        <p className="text-xs text-muted-foreground">Note: Generating a new key will invalidate any existing keys.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Webhooks</h3>
        <p className="text-sm text-muted-foreground">
          Set up webhooks to receive notifications when events occur in your CheckIt account.
        </p>
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <div className="flex space-x-4">
            <Input id="webhook-url" placeholder="https://your-app.com/webhook" />
            <Button>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
