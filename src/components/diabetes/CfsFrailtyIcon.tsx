import { cn } from "@/lib/utils";
import type { FrailtyLevel } from "./frailtyLevel";
import cfs1 from "@/assets/frailty/cfs-1-very-fit.svg";
import cfs2 from "@/assets/frailty/cfs-2-well.svg";
import cfs3 from "@/assets/frailty/cfs-3-managing-well.svg";
import cfs4 from "@/assets/frailty/cfs-4-vulnerable.svg";
import cfs5 from "@/assets/frailty/cfs-5-mildly-frail.svg";
import cfs6 from "@/assets/frailty/cfs-6-moderately-frail.svg";
import cfs7 from "@/assets/frailty/cfs-7-severely-frail.svg";
import cfs8 from "@/assets/frailty/cfs-8-very-severely-frail.svg";
import cfs9 from "@/assets/frailty/cfs-9-terminally-ill.svg";

/** Traced Rockwood CFS silhouettes (CFS 1–9). Unknown has no figure icon. */
const CFS_ICON_SRC: Partial<Record<FrailtyLevel, string>> = {
  cfs_1: cfs1,
  cfs_2: cfs2,
  cfs_3: cfs3,
  cfs_4: cfs4,
  cfs_5: cfs5,
  cfs_6: cfs6,
  cfs_7: cfs7,
  cfs_8: cfs8,
  cfs_9: cfs9,
};

export const CFS_FRAILTY_ICON_ATTRIBUTION =
  "Icons adapted from Rockwood Clinical Frailty Scale © Dalhousie University";

interface Props {
  level: FrailtyLevel;
  className?: string;
}

/**
 * Compact CFS silhouette. CSS mask + themed fill so the green stays readable
 * on light cards and in dark mode (lighter emerald on dark backgrounds).
 */
export default function CfsFrailtyIcon({ level, className }: Props) {
  const src = CFS_ICON_SRC[level];
  if (!src) return null;

  return (
    <span
      aria-hidden
      data-testid={`frailty-cfs-icon-${level}`}
      className={cn(
        "mt-0.5 inline-block size-7 shrink-0 bg-[#2f8f45] dark:bg-emerald-400",
        className,
      )}
      style={{
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
