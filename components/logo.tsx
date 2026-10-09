import { cn } from "@/lib/utils"

/** Logo de l'app (disque seul), fourni dans public/assets. "white" : pour les fonds colorés. */
export function Logo({ className, variant = "color" }: { className?: string; variant?: "color" | "white" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "white" ? "/assets/svg/mark-white.svg" : "/assets/svg/mark-light.svg"}
      alt=""
      aria-hidden="true"
      className={cn("shrink-0", className)}
    />
  )
}
