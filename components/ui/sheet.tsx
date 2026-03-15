"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Render a Sheet root element with a stable data-slot for styling and composition.
 *
 * @param props - Props forwarded to the underlying Sheet root element
 * @returns The rendered Sheet root element
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

/**
 * Renders a Sheet trigger element used to open or toggle the sheet.
 *
 * Renders a Radix `Sheet.Trigger` with `data-slot="sheet-trigger"` and applies any provided props.
 *
 * @returns The `Sheet.Trigger` element with `data-slot="sheet-trigger"` and forwarded props.
 */
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

/**
 * Renders a Sheet close control element annotated with the `sheet-close` slot.
 *
 * @returns A `SheetPrimitive.Close` element with `data-slot="sheet-close"` and any provided props
 */
function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * Renders a Radix Sheet.Portal preconfigured with data-slot="sheet-portal" and forwards all props.
 *
 * @returns The rendered Portal element with forwarded props.
 */
function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/**
 * Renders the sheet backdrop overlay with a default semi-transparent background and open/close animations.
 *
 * @param className - Additional CSS classes to apply to the overlay element
 * @returns The overlay element used as the sheet backdrop
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the sheet's content panel inside a portal with an overlay.
 *
 * The panel is positioned and sized according to `side` and can optionally render
 * a built-in close button.
 *
 * @param side - Which edge the sheet should appear from: `"top"`, `"right"`, `"bottom"`, or `"left"`. Defaults to `"right"`.
 * @param showCloseButton - Whether to include the built-in close control in the panel. Defaults to `true`.
 * @param className - Additional class names to merge with the component's default styles.
 * @returns A sheet content element mounted in a portal with overlay, positioned per `side` and optionally containing a close button.
 */
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/**
 * Container for sheet header content that provides default vertical layout, gap, and padding.
 *
 * @param className - Additional CSS classes to merge with the default header styles
 * @param props - Any other props are forwarded to the underlying `div`
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

/**
 * Container element for sheet footer content.
 *
 * Merges provided `className` with the component's default footer layout (vertical stack, spacing, padding).
 *
 * @param className - Additional CSS classes to append to the default footer styles
 * @returns A `div` element that serves as the sheet footer, combining default footer styles with any provided classes
 */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

/**
 * Renders the sheet's title element with standardized styling and a `data-slot="sheet-title"` attribute.
 *
 * @returns A `SheetPrimitive.Title` element with the class names `font-semibold text-foreground` merged with any provided `className` and all forwarded props.
 */
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders a sheet description element with preset muted styling and a data-slot attribute.
 *
 * @param className - Additional CSS classes to merge with the component's default styles
 * @returns A Sheet.Description element with combined class names and `data-slot="sheet-description"`
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
