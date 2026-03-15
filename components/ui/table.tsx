"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Renders a table inside a full-width, horizontally scrollable container.
 *
 * Merges the provided `className` with the component's default table classes and forwards all other props to the underlying `table` element.
 *
 * @param className - Additional CSS class names to apply to the table
 * @param props - Standard attributes for a `table` element that will be forwarded to the underlying `table`
 * @returns A table element wrapped in a container div with overflow-x handling
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

/**
 * Renders a table header section (<thead>) that applies a bottom border to each row and forwards all received props to the underlying element.
 *
 * @param className - Additional CSS classes to merge with the component's default styling
 * @param props - Additional props passed through to the underlying <thead> element
 * @returns The rendered <thead> element
 */
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

/**
 * Renders a table body element with default styling and forwards all props to the underlying `tbody`.
 *
 * @param className - Additional CSS class names to merge with the component's default classes
 * @returns The rendered `tbody` element with merged class names and forwarded attributes
 */
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

/**
 * Renders a table footer (`tfoot`) with default footer styling and a `data-slot="table-footer"` attribute.
 *
 * @param className - Additional CSS class names to merge with the component's default footer styles.
 * @returns A `tfoot` element with merged class names, footer-specific styles, and all other props forwarded.
 */
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a table row (<tr>) element with standardized border, hover, and selected-state styling.
 *
 * The element includes a bottom border, color transition, a muted hover background, and a muted background
 * when `data-state="selected"`. Accepts and forwards all native <tr> props; `className` is merged with the defaults.
 *
 * @returns A `<tr>` element with default row styling and any provided props applied.
 */
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a styled table header cell.
 *
 * @param className - Additional CSS class names to merge with the component's default styles
 * @returns A `th` element with data-slot="table-head" and merged class names for layout, alignment, and checkbox-aware adjustments
 */
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Table cell component that renders a `td` with standardized padding, vertical alignment, and checkbox-aware spacing.
 *
 * Forwards all other `td` props to the underlying element and merges `className` with the default styling.
 *
 * @param className - Additional class names to merge with the component's default classes
 * @returns The rendered table cell (`td`) element
 */
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a table caption with a default top margin and muted text styling.
 *
 * The component forwards all received props to the underlying `caption` element.
 *
 * @returns The rendered `caption` element with applied top margin and muted foreground text.
 */
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
