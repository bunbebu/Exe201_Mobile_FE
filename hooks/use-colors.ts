import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/context/ThemeContext";

/**
 * Returns the full color set for the current theme (light or dark).
 */
export function useColors() {
  const { theme } = useAppTheme();
  return Colors[theme];
}
