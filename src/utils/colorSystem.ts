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

// Optimized color palette - only commonly used colors
const createColor = (name: string, value: string, hex: string): AccentColor => ({
  name, value, tailwindClass: value, hexValue: hex
});

export const TAILWIND_ACCENT_COLORS: AccentColor[] = [
  // Blues
  createColor('Blue', 'blue-500', '#3b82f6'),
  createColor('Sky', 'sky-500', '#0ea5e9'),
  createColor('Cyan', 'cyan-500', '#06b6d4'),
  
  // Greens
  createColor('Emerald', 'emerald-500', '#10b981'),
  createColor('Green', 'green-500', '#22c55e'),
  createColor('Teal', 'teal-600', '#0d9488'),
  
  // Reds/Pinks
  createColor('Red', 'red-500', '#ef4444'),
  createColor('Rose', 'rose-500', '#f43f5e'),
  createColor('Pink', 'pink-500', '#ec4899'),
  
  // Purples
  createColor('Purple', 'purple-500', '#a855f7'),
  createColor('Violet', 'violet-500', '#8b5cf6'),
  createColor('Indigo', 'indigo-500', '#6366f1'),
  
  // Oranges/Yellows
  createColor('Orange', 'orange-500', '#f97316'),
  createColor('Amber', 'amber-500', '#f59e0b'),
  createColor('Yellow', 'yellow-500', '#eab308'),
  
  // Neutrals
  createColor('Slate', 'slate-600', '#475569'),
  createColor('Gray', 'gray-700', '#374151'),
];

// Default selected accent colors
export const DEFAULT_ACCENT_COLORS: AccentColor[] = [
  createColor('Blue', 'blue-500', '#3b82f6'),
  createColor('Purple', 'violet-500', '#8b5cf6'),
  createColor('Green', 'teal-600', '#0d9488'),
  createColor('Red', 'red-500', '#ef4444'),
  createColor('Orange', 'orange-500', '#f97316'),
  createColor('Pink', 'pink-500', '#ec4899'),
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

// Cache for color lookups
const colorCache = new Map<string, AccentColor>();

/**
 * Get Tailwind CSS classes for an accent color (optimized with caching)
 */
export const getAccentClasses = (accentColor: string, customColors: AccentColor[] = []) => {
  // Check cache first
  let color = colorCache.get(accentColor);
  
  if (!color) {
    // Find color in all available colors
    const allColors = [...DEFAULT_ACCENT_COLORS, ...TAILWIND_ACCENT_COLORS, ...customColors];
    color = allColors.find(c => c.value === accentColor);
    
    if (color) {
      colorCache.set(accentColor, color);
    }
  }

  if (color) {
    const [colorName, shade] = color.value.split('-');
    const shadeNum = parseInt(shade);
    const hoverShade = shadeNum >= 800 ? shadeNum - 100 : shadeNum + 100;

    return {
      bg: `bg-${color.value}`,
      hover: `hover:bg-${colorName}-${hoverShade}`,
      text: `text-${color.value}`,
      border: `border-${color.value}`,
      ring: `ring-${color.value}`
    };
  }

  // Fallback
  return {
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    text: 'text-blue-500',
    border: 'border-blue-500',
    ring: 'ring-blue-500'
  };
};

/**
 * Get hex value for an accent color (optimized with caching)
 */
export const getAccentHex = (accentColor: string, customColors: AccentColor[] = []): string => {
  // Check cache first
  let color = colorCache.get(accentColor);
  
  if (!color) {
    const allColors = [...DEFAULT_ACCENT_COLORS, ...TAILWIND_ACCENT_COLORS, ...customColors];
    color = allColors.find(c => c.value === accentColor);
    
    if (color) {
      colorCache.set(accentColor, color);
    }
  }

  return color?.hexValue || '#3b82f6';
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

