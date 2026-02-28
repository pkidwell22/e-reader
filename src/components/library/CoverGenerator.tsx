
import { getGradientForTitle } from "@/lib/utils";

interface CoverGeneratorProps {
  title: string;
  author: string;
  className?: string;
}

export function CoverGenerator({ title, author, className = "" }: CoverGeneratorProps) {
  const [color1, color2] = getGradientForTitle(title);

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        aspectRatio: "2/3",
        width: "100%",
      }}
    >
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)",
        }}
      />

      {/* Title & Author */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
        <h3
          className="font-sans text-sm font-semibold leading-tight text-white drop-shadow-sm"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          {title}
        </h3>
        {author && author !== "Unknown" && (
          <p
            className="font-sans text-xs font-normal text-white/80"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
          >
            {author}
          </p>
        )}
      </div>
    </div>
  );
}
