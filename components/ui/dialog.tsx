"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Renders a Radix Dialog root element with a standardized data-slot and forwards all props.
 *
 * @returns The Dialog root React element configured with `data-slot="dialog"` and the provided props.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * Renders the trigger element for a dialog.
 *
 * @returns The dialog trigger element.
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * Renders a Radix Dialog portal with a standardized `data-slot="dialog-portal"` attribute.
 *
 * @param props - Props forwarded to `DialogPrimitive.Portal`
 * @returns The Radix Dialog Portal element with the standardized data-slot and forwarded props
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * Renders a dialog close control with a standardized data-slot attribute.
 *
 * @param props - All props are forwarded to the underlying close element
 * @returns A React element representing the dialog close control
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * Renders the dialog overlay (full-screen backdrop) with default styling and any provided className merged.
 *
 * @returns A JSX element that renders a fullscreen, semi-transparent backdrop for the dialog.
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders dialog content inside a portal with an overlay and an optional top-right close button.
 *
 * @param showCloseButton - If `true`, renders a close control in the top-right corner of the dialog; defaults to `true`.
 * @returns A DialogPrimitive.Content element containing the provided children and, when enabled, a close control.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * Renders the dialog header container with default vertical layout and responsive text alignment.
 *
 * @param className - Additional CSS classes to merge with the default header classes
 * @param props - Additional props spread onto the rendered `div` (e.g., event handlers, id)
 * @returns A `div` element with data-slot="dialog-header" serving as the dialog's header area
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * Renders the dialog footer area with responsive layout and an optional close control.
 *
 * @param className - Additional CSS classes to apply to the footer container
 * @param showCloseButton - When `true`, renders a "Close" button wired to the dialog close action
 * @returns The footer element containing children and, optionally, a close button
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

/**
 * Renders a DialogPrimitive.Title with standardized typography and a data-slot attribute.
 *
 * @returns A DialogPrimitive.Title React element with the component's typography classes merged with any provided `className` and `data-slot="dialog-title"`.
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders a dialog description element with default small, muted typography and a `data-slot="dialog-description"` attribute.
 *
 * @returns A DialogPrimitive.Description element with the component's default styling (`text-sm text-muted-foreground`) and any additional `className` merged into it.
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
