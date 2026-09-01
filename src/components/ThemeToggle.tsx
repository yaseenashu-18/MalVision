import { useTheme } from "../lib/themeContext";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <AnimatedThemeToggler
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
    />
  );
}
