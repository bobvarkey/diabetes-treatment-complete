import { Monitor, Moon, Sun } from "lucide-react";
import { useMemo } from "react";
import { ensureContrast, useThemeColors } from "@/lib/accessibility";

import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "auto", label: "Auto (system)", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const colors = useThemeColors();
  const accessibleFg = useMemo(() => ensureContrast(colors.foreground, colors.background), [colors.foreground, colors.background]);
  const accessiblePrimaryFg = useMemo(() => ensureContrast(colors.primaryForeground || "oklch(0.99 0.01 55)", colors.primary), [colors.primaryForeground, colors.primary]);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 shadow-sm"
      style={{ backgroundColor: `color-mix(in oklab, ${colors.card} 70%, transparent)`, borderColor: colors.border }}
    >

      {OPTS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full transition-colors motion-reduce:transition-none",
              "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-primary hover:bg-primary/90",
            )}
            style={{ color: active ? accessiblePrimaryFg : accessibleFg }}

          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
