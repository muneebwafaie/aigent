"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Render a Popover root element that applies data-slot="popover" and forwards all received props.
 *
 * @param props - Props forwarded to `PopoverPrimitive.Root`
 * @returns The rendered Popover root element
 */
function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

/**
 * Renders a popover trigger element that forwards all props and attaches data-slot="popover-trigger".
 *
 * @returns The underlying PopoverPrimitive.Trigger element with forwarded props and the `data-slot="popover-trigger"` attribute.
 */
function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/**
 * Renders popover content inside a Portal with standardized styling and a data-slot attribute.
 *
 * Merges provided `className` with the component's default utility classes, sets `data-slot="popover-content"`,
 * and forwards all other props to Radix's PopoverPrimitive.Content.
 *
 * @param className - Additional CSS classes to merge with the component's default styles
 * @param align - Alignment of the content relative to the trigger (e.g., "center", "start", "end")
 * @param sideOffset - Distance in pixels between the trigger and the content
 * @returns The popover content element rendered within a portal
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

/**
 * Renders a popover anchor element with a standardized `data-slot` attribute and forwards all props.
 *
 * @returns The rendered PopoverPrimitive.Anchor element with `data-slot="popover-anchor"` and any provided props applied.
 */
function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

/**
 * Renders a header container for a popover.
 *
 * Applies vertical layout and small text styling, merging any provided `className`.
 *
 * @param className - Additional CSS class names to merge with the default header classes
 * @returns A `div` element used as the popover header
 */
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  )
}

/**
 * Render a popover title element with default title styling and a `data-slot` attribute.
 *
 * @param className - Additional CSS classes to merge with the default title styling
 * @returns The title element for use inside a Popover
 */
function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

/**
 * Renders the popover's descriptive text element with standardized slot and styling.
 *
 * @param className - Additional CSS classes merged with the component's default muted-foreground styling
 * @returns A `p` element used as the popover description
 */
function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
