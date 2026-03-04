import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, HelpCircle, Mail, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Help & Support | CheckIt",
  description: "Get help and support for CheckIt",
}

export default function HelpPage() {
  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center text-center mb-10">
        <div className="inline-flex items-center justify-center p-2 bg-purple-100 rounded-full mb-4">
          <HelpCircle className="h-6 w-6 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Help & Support</h1>
        <p className="text-muted-foreground max-w-2xl">
          Get help, find answers, and connect with our support team. We're here to ensure you have the best experience
          with CheckIt.
        </p>
      </div>

      <Tabs defaultValue="contact" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="contact" className="text-sm sm:text-base py-3">
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-sm sm:text-base py-3">
              FAQ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contact" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5">
                  <div className="grid gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Name
                      </Label>
                      <Input id="name" placeholder="Your name" className="h-11" />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input id="email" type="email" placeholder="Your email address" className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </Label>
                    <Select>
                      <SelectTrigger id="subject" className="h-11">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Message
                    </Label>
                    <Textarea id="message" placeholder="How can we help you?" className="min-h-[140px] resize-none" />
                  </div>
                  <Button type="submit" className="w-full h-11 mt-2">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Other ways to reach us</CardTitle>
                <CardDescription>Choose the method that works best for you.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base mb-1">Email Us</h3>
                    <p className="text-sm text-muted-foreground mb-2">For general inquiries and support:</p>
                    <p className="text-sm font-medium text-purple-600">checkittaskmanagement@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-base mb-1">Call Us</h3>
                    <p className="text-sm text-muted-foreground mb-2">Monday to Friday, 9am to 5pm (EST):</p>
                    <p className="text-sm font-medium text-purple-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-5 mt-6">
                  <h3 className="font-medium text-base mb-2">Response Time</h3>
                  <p className="text-sm text-muted-foreground">
                    We aim to respond to all inquiries within 24 hours during business days. For urgent matters, please
                    call our support line.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
              <CardDescription>Find quick answers to common questions about CheckIt.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    How do I create a new task?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    To create a new task, navigate to your Dashboard and click the "Add Task" button. Fill in the task
                    details including title, description, due date, and priority level, then click "Save" to add it to
                    your task list.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    How does the 3D visualization work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    Our 3D visualization transforms your tasks into an interactive landscape. Each task is represented
                    as an object in the 3D space, with size and color indicating priority and status. As you complete
                    tasks, your productivity universe grows and evolves.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    How secure is my data?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    CheckIt takes security seriously. All data is encrypted both in transit and at rest. We use
                    industry-standard security practices and regular security audits to ensure your information remains
                    protected.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    Is there a way to categorize my tasks?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    Yes, CheckIt allows you to categorize tasks by type and priority. When creating or editing a task,
                    you can select a category and priority level to help organize your work more effectively.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    How do I change my account settings?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    To change your account settings, click on the "Profile" option in the sidebar menu. From there, you
                    can update your profile information, change your password, and manage your account preferences.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    Is there a mobile app available?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    Currently, CheckIt is available as a web application only. We've designed it to be fully responsive,
                    so you can access and use it from any mobile device through your web browser. A dedicated mobile app
                    is on our roadmap for future development.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7" className="border-b py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    How do I view my task statistics?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    CheckIt provides detailed task statistics in the Analytics section. Click on "Analytics" in the
                    sidebar menu to view charts and graphs showing your task completion rates, priority distribution,
                    and productivity trends over time.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8" className="border-b-0 py-1">
                  <AccordionTrigger className="text-base font-medium py-3 hover:no-underline hover:text-purple-600">
                    Can I set reminders for my tasks?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 pt-1">
                    Yes, when creating or editing a task, you can set a due date and time. CheckIt will display upcoming
                    and overdue tasks prominently in your dashboard to help you stay on track with your commitments.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
