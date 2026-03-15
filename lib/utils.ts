import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Compose class names from arbitrary inputs and resolve Tailwind CSS utility conflicts.
 *
 * @param inputs - Values accepted by `clsx` (strings, arrays, objects, conditionals) representing classes to compose
 * @returns The final class name string with Tailwind classes merged and conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
