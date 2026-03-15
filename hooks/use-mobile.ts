import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Determines whether the current viewport width is considered mobile.
 *
 * The returned value updates automatically when the viewport crosses the mobile breakpoint.
 *
 * @returns `true` if the viewport width is less than 768px, `false` otherwise.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
