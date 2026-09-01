import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/themeContext";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Browser fallback
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    const transition = document.startViewTransition(() => {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      setTheme(nextTheme);
    });

    await transition.ready;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 450,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/60 bg-neutral-100/80 hover:bg-neutral-200/60 dark:border-neutral-700/60 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer active:scale-95"
      aria-label="Toggle theme"
      title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
      ) : (
        <Moon className="h-4 w-4 text-neutral-800 dark:text-neutral-200 stroke-[1.5]" />
      )}
    </button>
  );
}
