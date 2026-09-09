import { ExternalLink } from "lucide-react";
import { isSafeUrl } from "@/lib/orders";

/** "Shiko produktin ↗" — opens the saved order URL safely in a new tab. */
export function ProductLink({ url, className = "" }: { url?: string; className?: string }) {
  if (!isSafeUrl(url)) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline ${className}`}
    >
      Shiko produktin <ExternalLink className="size-3" />
    </a>
  );
}
