import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Cycling typewriter text. Client-only animation, SSR renders the first phrase. */
export function Typewriter({
  phrases,
  className,
  speed = 42,
  hold = 1600,
}: {
  phrases: string[];
  className?: string;
  speed?: number;
  hold?: number;
}) {
  const [index, setIndex] = useState(0);
  const [len, setLen] = useState(phrases[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const phrase = phrases[index] ?? "";
    if (!deleting && len === phrase.length) {
      const t = setTimeout(() => setDeleting(true), hold);
      return () => clearTimeout(t);
    }
    if (deleting && len === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(() => setLen((l) => l + (deleting ? -1 : 1)), deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [len, deleting, index, phrases, speed, hold, mounted]);

  const text = (phrases[index] ?? "").slice(0, len);

  return <span className={cn("caret-blink font-mono", className)}>{text}</span>;
}
