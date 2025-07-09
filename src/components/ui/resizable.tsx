"use client"

import {
  PanelGroup as PanelGroupPrimitive,
  type PanelGroupProps,
  Panel as PanelPrimitive,
  type PanelProps,
  PanelResizeHandle as PanelResizeHandlePrimitive,
  type PanelResizeHandleProps,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof PanelGroupPrimitive>) => (
  <PanelGroupPrimitive
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = PanelPrimitive

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: PanelResizeHandleProps & {
  withHandle?: boolean
}) => (
  <PanelResizeHandlePrimitive
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=horizontal]]:h-full",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-1.5 items-center justify-center rounded-sm border bg-border" />
    )}
  </PanelResizeHandlePrimitive>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
