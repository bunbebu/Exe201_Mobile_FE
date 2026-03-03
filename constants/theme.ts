/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#3B82F6";
const tintColorDark = "#60A5FA";

export const Colors = {
  light: {
    // base
    text: "#11181C",
    background: "#F5F5F5",
    surface: "#FFFFFF",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    // semantic
    secondaryText: "#666666",
    mutedText: "#9CA3AF",
    border: "#E5E7EB",
    separator: "#F3F4F6",
    headerBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    inputBg: "#FFFFFF",
    notificationBtnBg: "#F5F5F5",
    tabBarBg: "#FFFFFF",
    tabBarBorder: "#E5E7EB",
    // quick action dark bg (for dark mode these colors shift)
    qaBlueBg: "#EBF5FF",
    qaYellowBg: "#FEF3C7",
    qaGreenBg: "#D1FAE5",
    qaPurpleBg: "#EDE9FE",
    // category cards keep their pastel in light, become dark tinted in dark
    tipCardBg: "#FEF3C7",
    challengeCardBg: "#EDE9FE",
  },
  dark: {
    // base
    text: "#ECEDEE",
    background: "#0D0D0F",
    surface: "#1C1C1E",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorDark,
    // semantic
    secondaryText: "#A8A8B3",
    mutedText: "#6B7280",
    border: "#2D2D2F",
    separator: "#2D2D2F",
    headerBg: "#1C1C1E",
    cardBg: "#1C1C1E",
    inputBg: "#2C2C2E",
    notificationBtnBg: "#2C2C2E",
    tabBarBg: "#1C1C1E",
    tabBarBorder: "#2D2D2F",
    // quick action dark bg
    qaBlueBg: "#1E3A5F",
    qaYellowBg: "#3D2E0A",
    qaGreenBg: "#0D3320",
    qaPurpleBg: "#2D1F4E",
    // card bgs
    tipCardBg: "#3D2E0A",
    challengeCardBg: "#2D1F4E",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
