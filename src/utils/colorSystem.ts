/**
 * Centralized color system for the application
 * Fully integrated with Tailwind CSS for maximum performance and consistency
 */

export interface AccentColor {
  name: string;
  value: string;
  tailwindClass: string;
  hexValue: string;
  isCustom?: boolean;
}

export interface BackgroundColor {
  key: string;
  cls: string;
  label: string;
  isCustom?: boolean;
}

// Complete Tailwind CSS color palette for accent colors
export const TAILWIND_ACCENT_COLORS: AccentColor[] = [
  // Blues
  { name: 'Blue 400', value: 'blue-400', tailwindClass: 'blue-400', hexValue: '#60a5fa' },
  { name: 'Blue 500', value: 'blue-500', tailwindClass: 'blue-500', hexValue: '#3b82f6' },
  { name: 'Blue 600', value: 'blue-600', tailwindClass: 'blue-600', hexValue: '#2563eb' },
  { name: 'Sky 400', value: 'sky-400', tailwindClass: 'sky-400', hexValue: '#38bdf8' },
  { name: 'Sky 500', value: 'sky-500', tailwindClass: 'sky-500', hexValue: '#0ea5e9' },
  { name: 'Cyan 400', value: 'cyan-400', tailwindClass: 'cyan-400', hexValue: '#22d3ee' },
  { name: 'Cyan 500', value: 'cyan-500', tailwindClass: 'cyan-500', hexValue: '#06b6d4' },

  // Greens
  { name: 'Emerald 400', value: 'emerald-400', tailwindClass: 'emerald-400', hexValue: '#34d399' },
  { name: 'Emerald 500', value: 'emerald-500', tailwindClass: 'emerald-500', hexValue: '#10b981' },
  { name: 'Green 400', value: 'green-400', tailwindClass: 'green-400', hexValue: '#4ade80' },
  { name: 'Green 500', value: 'green-500', tailwindClass: 'green-500', hexValue: '#22c55e' },
  { name: 'Teal 600', value: 'teal-600', tailwindClass: 'teal-600', hexValue: '#0d9488' },
  { name: 'Teal 700', value: 'teal-700', tailwindClass: 'teal-700', hexValue: '#0f766e' },
  { name: 'Lime 400', value: 'lime-400', tailwindClass: 'lime-400', hexValue: '#a3e635' },
  { name: 'Lime 500', value: 'lime-500', tailwindClass: 'lime-500', hexValue: '#84cc16' },

  // Reds/Pinks
  { name: 'Red 400', value: 'red-400', tailwindClass: 'red-400', hexValue: '#f87171' },
  { name: 'Red 500', value: 'red-500', tailwindClass: 'red-500', hexValue: '#ef4444' },
  { name: 'Rose 400', value: 'rose-400', tailwindClass: 'rose-400', hexValue: '#fb7185' },
  { name: 'Rose 500', value: 'rose-500', tailwindClass: 'rose-500', hexValue: '#f43f5e' },
  { name: 'Pink 400', value: 'pink-400', tailwindClass: 'pink-400', hexValue: '#f472b6' },
  { name: 'Pink 500', value: 'pink-500', tailwindClass: 'pink-500', hexValue: '#ec4899' },

  // Purples
  { name: 'Purple 400', value: 'purple-400', tailwindClass: 'purple-400', hexValue: '#c084fc' },
  { name: 'Purple 500', value: 'purple-500', tailwindClass: 'purple-500', hexValue: '#a855f7' },
  { name: 'Violet 400', value: 'violet-400', tailwindClass: 'violet-400', hexValue: '#a78bfa' },
  { name: 'Violet 500', value: 'violet-500', tailwindClass: 'violet-500', hexValue: '#8b5cf6' },
  { name: 'Indigo 400', value: 'indigo-400', tailwindClass: 'indigo-400', hexValue: '#818cf8' },
  { name: 'Indigo 500', value: 'indigo-500', tailwindClass: 'indigo-500', hexValue: '#6366f1' },

  // Oranges/Yellows
  { name: 'Orange 400', value: 'orange-400', tailwindClass: 'orange-400', hexValue: '#fb923c' },
  { name: 'Orange 500', value: 'orange-500', tailwindClass: 'orange-500', hexValue: '#f97316' },
  { name: 'Amber 400', value: 'amber-400', tailwindClass: 'amber-400', hexValue: '#fbbf24' },
  { name: 'Amber 500', value: 'amber-500', tailwindClass: 'amber-500', hexValue: '#f59e0b' },
  { name: 'Yellow 400', value: 'yellow-400', tailwindClass: 'yellow-400', hexValue: '#facc15' },
  { name: 'Yellow 500', value: 'yellow-500', tailwindClass: 'yellow-500', hexValue: '#eab308' },

  // Neutrals
  { name: 'Slate 600', value: 'slate-600', tailwindClass: 'slate-600', hexValue: '#475569' },
  { name: 'Slate 700', value: 'slate-700', tailwindClass: 'slate-700', hexValue: '#334155' },
  { name: 'Gray 600', value: 'gray-600', tailwindClass: 'gray-600', hexValue: '#4b5563' },
  { name: 'Gray 700', value: 'gray-700', tailwindClass: 'gray-700', hexValue: '#374151' },
  { name: 'Gray 800', value: 'gray-800', tailwindClass: 'gray-800', hexValue: '#1f2937' },
  { name: 'Gray 900', value: 'gray-900', tailwindClass: 'gray-900', hexValue: '#111827' },
];

// Default selected accent colors (closest matches to current colors)
export const DEFAULT_ACCENT_COLORS: AccentColor[] = [
  { name: 'Blue', value: 'blue-500', tailwindClass: 'blue-500', hexValue: '#3b82f6' },
  { name: 'Purple', value: 'violet-500', tailwindClass: 'violet-500', hexValue: '#8b5cf6' },
  { name: 'Green', value: 'teal-700', tailwindClass: 'teal-700', hexValue: '#0f766e' },
  { name: 'Red', value: 'red-500', tailwindClass: 'red-500', hexValue: '#ef4444' },
  { name: 'Orange', value: 'orange-500', tailwindClass: 'orange-500', hexValue: '#f97316' },
  { name: 'Pink', value: 'pink-500', tailwindClass: 'pink-500', hexValue: '#ec4899' },
  { name: 'Black', value: 'gray-900', tailwindClass: 'gray-900', hexValue: '#111827' },
];

// Default light theme backgrounds
export const DEFAULT_LIGHT_BACKGROUNDS: BackgroundColor[] = [
  { key: 'gray-50', cls: 'bg-gray-50', label: '50' },
  { key: 'gray-100', cls: 'bg-gray-100', label: '100' },
  { key: 'gray-200', cls: 'bg-gray-200', label: '200' },
  { key: 'gray-300', cls: 'bg-gray-300', label: '300' },
  { key: 'gray-400', cls: 'bg-gray-400', label: '400' }
];

// Default dark theme backgrounds
export const DEFAULT_DARK_BACKGROUNDS: BackgroundColor[] = [
  { key: 'gray-700', cls: 'bg-gray-700', label: '700' },
  { key: 'gray-800', cls: 'bg-gray-800', label: '800' },
  { key: 'gray-900', cls: 'bg-gray-900', label: '900' },
  { key: 'gray-950', cls: 'bg-gray-950', label: '950' },
  { key: 'neutral-900', cls: 'bg-neutral-900', label: 'N900' }
];

/**
 * Get Tailwind CSS classes for an accent color
 * Fully native Tailwind implementation for maximum performance
 */
export const getAccentClasses = (accentColor: string, customColors: AccentColor[] = []) => {
  // Check all colors (default + custom)
  const allColors = [...DEFAULT_ACCENT_COLORS, ...TAILWIND_ACCENT_COLORS, ...customColors];
  const color = allColors.find(c => c.value === accentColor);

  if (color) {
    const baseClass = color.tailwindClass;
    const [colorName, shade] = baseClass.split('-');
    const shadeNum = parseInt(shade);

    // Calculate hover shade (darker for most colors, lighter for very dark ones)
    let hoverShade = shadeNum >= 800 ? shadeNum - 100 : shadeNum + 100;

    return {
      bg: `bg-${baseClass}`,
      hover: `hover:bg-${colorName}-${hoverShade}`,
      text: `text-${baseClass}`,
      border: `border-${baseClass}`,
      ring: `ring-${baseClass}`
    };
  }

  // Fallback to blue-500
  return {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-blue-500',
    border: 'border-blue-500',
    ring: 'ring-blue-500'
  };
};

/**
 * Get hex value for an accent color (for CSS custom properties)
 */
export const getAccentHex = (accentColor: string, customColors: AccentColor[] = []): string => {
  const allColors = [...DEFAULT_ACCENT_COLORS, ...TAILWIND_ACCENT_COLORS, ...customColors];
  const color = allColors.find(c => c.value === accentColor);

  return color?.hexValue || '#3b82f6'; // fallback to blue-500
};

/**
 * Generate a random Tailwind color
 */
export const generateRandomColor = (): AccentColor => {
  const randomIndex = Math.floor(Math.random() * TAILWIND_ACCENT_COLORS.length);
  return TAILWIND_ACCENT_COLORS[randomIndex];
};

/**
 * Generate a unique value for custom colors
 */
export const generateColorValue = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now();
};

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Determine if a color is light or dark
 */
export const isLightColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
};

/**
 * Validate hex color format
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

