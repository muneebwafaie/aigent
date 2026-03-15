"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"

/**
 * Render a Collapsible root element with a fixed `data-slot` and all received props forwarded.
 *
 * @param props - Props forwarded to the underlying Collapsible root element
 * @returns A React element for the Collapsible root with `data-slot="collapsible"`
 */
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

/**
 * Renders a Radix CollapsibleTrigger element with the `data-slot="collapsible-trigger"` attribute.
 *
 * @param props - Props forwarded to the underlying Radix CollapsibleTrigger component.
 * @returns A CollapsibleTrigger React element with the provided props applied.
 */
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/**
 * Renders a collapsible content container and forwards all received props to the underlying element.
 *
 * @param props - Props accepted by the underlying CollapsibleContent primitive; all props are spread onto the rendered element.
 * @returns A React element representing the collapsible content container with `data-slot="collapsible-content"`.
 */
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
