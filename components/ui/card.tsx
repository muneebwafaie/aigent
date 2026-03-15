import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Renders a div that serves as a card container with default layout, border, background, text, and shadow styles.
 *
 * @returns A div element used as the card wrapper with composed default classes and any provided `className` and other props applied.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the header section of a Card component.
 *
 * Applies default responsive grid and spacing classes, sets `data-slot="card-header"`,
 * and spreads any additional div props onto the element.
 *
 * @param className - Additional CSS class names to merge with the default header classes
 * @returns A div element with `data-slot="card-header"` and the composed header classes
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the card title container.
 *
 * @param className - Additional CSS classes to apply to the title container
 * @returns A div element with `data-slot="card-title"` and default title typography classes
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * Renders the card's description area.
 *
 * @returns A div element that serves as the card description area with small, muted text styling and accepts any standard div props (including `className`).
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * Renders a container for card actions positioned within the card layout.
 *
 * @returns A div element with data-slot="card-action" and positioning classes applied to place action controls in the card's layout.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the card's main content container.
 *
 * @param className - Additional CSS classes merged with the component's default horizontal padding.
 * @returns A div element with `data-slot="card-content"` that applies horizontal padding and any provided classes, forwarding all other div props.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

/**
 * Renders a card footer container with default spacing and layout classes.
 *
 * @returns A `div` element with `data-slot="card-footer"`, default footer classes, merged `className`, and all other passed div props.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
