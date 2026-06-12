import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/utilidades/ui"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex items-center border-b border-slate-200 dark:border-slate-700",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName


const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex items-center gap-2 pb-3 px-4",
      "text-sm font-bold whitespace-nowrap",
      "border-b-2 -mb-px",
      "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
      "data-[state=active]:border-blue-600 data-[state=active]:text-blue-600",
      "dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-blue-400",
      "transition-all duration-200 ease-in-out outline-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 focus-visible:rounded-sm",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30",
      "animate-fade-in",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

