import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { 
  AccentColor, 
  BackgroundColor, 
  DEFAULT_ACCENT_COLORS,
  TAILWIND_ACCENT_COLORS,
  DEFAULT_LIGHT_BACKGROUNDS, 
  DEFAULT_DARK_BACKGROUNDS,
  generateColorValue
} from '../utils/colorSystem';

interface ColorSystemState {
  customAccentColors: AccentColor[];
  customLightBackgrounds: BackgroundColor[];
  customDarkBackgrounds: BackgroundColor[];
}

export const useColorSystem = () => {
  const [colorSystem, setColorSystem] = useLocalStorage<ColorSystemState>('colorSystem', {
    customAccentColors: [],
    customLightBackgrounds: [],
    customDarkBackgrounds: []
  });

  // Get all accent colors (default + custom)
  const getAllAccentColors = (): AccentColor[] => {
    return [...DEFAULT_ACCENT_COLORS, ...colorSystem.customAccentColors];
  };

  // Get all available Tailwind colors for selection
  const getAllTailwindColors = (): AccentColor[] => {
    return TAILWIND_ACCENT_COLORS;
  };

  // Get all light backgrounds (default + custom)
  const getAllLightBackgrounds = (): BackgroundColor[] => {
    return [...DEFAULT_LIGHT_BACKGROUNDS, ...colorSystem.customLightBackgrounds];
  };

  // Get all dark backgrounds (default + custom)
  const getAllDarkBackgrounds = (): BackgroundColor[] => {
    return [...DEFAULT_DARK_BACKGROUNDS, ...colorSystem.customDarkBackgrounds];
  };

  // Add Tailwind accent color to active colors
  const addTailwindAccentColor = (tailwindColor: AccentColor): boolean => {
    // Check if already added
    const isAlreadyAdded = DEFAULT_ACCENT_COLORS.some(c => c.value === tailwindColor.value) ||
                          colorSystem.customAccentColors.some(c => c.value === tailwindColor.value);
    
    if (isAlreadyAdded) {
      return false;
    }

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: [...prev.customAccentColors, tailwindColor]
    }));

    return true;
  };

  // Add custom accent color (for Tailwind colors not in defaults)
  const addCustomAccentColor = (tailwindColor: AccentColor): boolean => {
    // Check if already added
    const isAlreadyAdded = DEFAULT_ACCENT_COLORS.some(c => c.value === tailwindColor.value) ||
                          colorSystem.customAccentColors.some(c => c.value === tailwindColor.value);
    
    if (isAlreadyAdded) {
      return false;
    }

    const customColor: AccentColor = {
      ...tailwindColor,
      isCustom: true
    };

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: [...prev.customAccentColors, customColor]
    }));

    return true;
  };

  // Remove custom accent color
  const removeAccentColor = (value: string): boolean => {
    const colorToRemove = colorSystem.customAccentColors.find(c => c.value === value);
    if (!colorToRemove || !colorToRemove.isCustom) {
      return false; // Can't remove default colors
    }

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: prev.customAccentColors.filter(c => c.value !== value)
    }));

    return true;
  };

  // Add custom light background
  const addLightBackground = (label: string, className: string): boolean => {
    if (!className.startsWith('bg-')) {
      return false;
    }

    const key = generateColorValue(label);
    const newBackground: BackgroundColor = {
      key,
      cls: className,
      label: label.trim(),
      isCustom: true
    };

    setColorSystem(prev => ({
      ...prev,
      customLightBackgrounds: [...prev.customLightBackgrounds, newBackground]
    }));

    return true;
  };

  // Remove custom light background
  const removeLightBackground = (key: string): boolean => {
    const backgroundToRemove = colorSystem.customLightBackgrounds.find(b => b.key === key);
    if (!backgroundToRemove || !backgroundToRemove.isCustom) {
      return false; // Can't remove default backgrounds
    }

    setColorSystem(prev => ({
      ...prev,
      customLightBackgrounds: prev.customLightBackgrounds.filter(b => b.key !== key)
    }));

    return true;
  };

  // Add custom dark background
  const addDarkBackground = (label: string, className: string): boolean => {
    if (!className.startsWith('bg-')) {
      return false;
    }

    const key = generateColorValue(label);
    const newBackground: BackgroundColor = {
      key,
      cls: className,
      label: label.trim(),
      isCustom: true
    };

    setColorSystem(prev => ({
      ...prev,
      customDarkBackgrounds: [...prev.customDarkBackgrounds, newBackground]
    }));

    return true;
  };

  // Remove custom dark background
  const removeDarkBackground = (key: string): boolean => {
    const backgroundToRemove = colorSystem.customDarkBackgrounds.find(b => b.key === key);
    if (!backgroundToRemove || !backgroundToRemove.isCustom) {
      return false; // Can't remove default backgrounds
    }

    setColorSystem(prev => ({
      ...prev,
      customDarkBackgrounds: prev.customDarkBackgrounds.filter(b => b.key !== key)
    }));

    return true;
  };

  // Update existing custom accent color
  const updateAccentColor = (value: string, name: string): boolean => {
    const colorIndex = colorSystem.customAccentColors.findIndex(c => c.value === value);
    if (colorIndex === -1) {
      return false;
    }

    const updatedColors = [...colorSystem.customAccentColors];
    updatedColors[colorIndex] = {
      ...updatedColors[colorIndex],
      name: name.trim()
    };

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: updatedColors
    }));

    return true;
  };

  return {
    // Getters
    getAllAccentColors,
    getAllTailwindColors,
    getAllLightBackgrounds,
    getAllDarkBackgrounds,
    
    // Accent color management
    addTailwindAccentColor,
    addCustomAccentColor,
    removeAccentColor,
    updateAccentColor,
    
    // Background management
    addLightBackground,
    removeLightBackground,
    addDarkBackground,
    removeDarkBackground,
    
    // Raw state for advanced usage
    colorSystem
  };
};