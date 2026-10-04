import osteoporosisInfographic from "@/assets/osteoporosis-risk-pathway-infographic.png";
import { ImageViewerTrigger } from "@/components/ImageViewer";

export default function OsteoporosisInfographic() {
  return (
    <figure className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <ImageViewerTrigger src={osteoporosisInfographic} alt="Osteoporosis Risk Stratification Algorithm">
        <img
          src={osteoporosisInfographic}
          alt="Osteoporosis Risk Stratification Algorithm"
          className="w-full h-auto"
          loading="lazy"
        />
      </ImageViewerTrigger>
      <figcaption className="p-3 text-xs text-center text-muted-foreground border-t border-border">
        Risk Stratification Algorithm for Osteoporosis Management
      </figcaption>
    </figure>
  );
}
