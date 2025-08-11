import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccentColor, BackgroundColor, DEFAULT_ACCENT_COLORS, DEFAULT_LIGHT_BACKGROUNDS, DEFAULT_DARK_BACKGROUNDS, generateColorValue } from '../utils/colorSystem';

// Local validation function
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

interface ColorSystemState {
  customAccentColors: AccentColor[];
  customLightBackgrounds: BackgroundColor[];
  customDarkBackgrounds: BackgroundColor[];
}

interface ColorSystemContextType {
  // State
  colorSystem: ColorSystemState;
  
  // Getters
  getAllAccentColors: () => AccentColor[];
  getAllLightBackgrounds: () => BackgroundColor[];
  getAllDarkBackgrounds: () => BackgroundColor[];
  
  // Actions
  addCustomAccentColor: (name: string, hexColor: string) => AccentColor | null;
  removeAccentColor: (value: string) => boolean;
  updateAccentColor: (value: string, name: string, hexColor?: string) => boolean;
  addLightBackground: (label: string, className: string) => boolean;
  removeLightBackground: (key: string) => boolean;
  addDarkBackground: (label: string, className: string) => boolean;
  removeDarkBackground: (key: string) => boolean;
}

const ColorSystemContext = createContext<ColorSystemContextType | undefined>(undefined);

export const ColorSystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [colorSystem, setColorSystem] = useState<ColorSystemState>(() => {
    try {
      const stored = localStorage.getItem('colorSystem');
      return stored ? JSON.parse(stored) : {
        customAccentColors: [],
        customLightBackgrounds: [],
        customDarkBackgrounds: []
      };
    } catch {
      return {
        customAccentColors: [],
        customLightBackgrounds: [],
        customDarkBackgrounds: []
      };
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('colorSystem', JSON.stringify(colorSystem));
  }, [colorSystem]);

  // Getters
  const getAllAccentColors = (): AccentColor[] => {
    return [...DEFAULT_ACCENT_COLORS, ...colorSystem.customAccentColors];
  };

  const getAllLightBackgrounds = (): BackgroundColor[] => {
    return [...DEFAULT_LIGHT_BACKGROUNDS, ...colorSystem.customLightBackgrounds];
  };

  const getAllDarkBackgrounds = (): BackgroundColor[] => {
    return [...DEFAULT_DARK_BACKGROUNDS, ...colorSystem.customDarkBackgrounds];
  };

  // Actions
  const addCustomAccentColor = (name: string, hexColor: string): AccentColor | null => {
    const normalizedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
    
    if (!isValidHexColor(normalizedHex)) {
      return null;
    }

    const value = generateColorValue(name);
    const customColor: AccentColor = {
      name: name.trim(),
      value,
      tailwindClass: `custom-${value}`,
      hexValue: normalizedHex.toUpperCase(),
      isCustom: true
    };

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: [...prev.customAccentColors, customColor]
    }));

    return customColor;
  };

  const removeAccentColor = (value: string): boolean => {
    const colorToRemove = colorSystem.customAccentColors.find(c => c.value === value);
    if (!colorToRemove || !colorToRemove.isCustom) {
      return false;
    }

    setColorSystem(prev => ({
      ...prev,
      customAccentColors: prev.customAccentColors.filter(c => c.value !== value)
    }));

    return true;
  };

  const updateAccentColor = (value: string, name: string, hexColor?: string): boolean => {
    const colorIndex = colorSystem.customAccentColors.findIndex(c => c.value === value);
    if (colorIndex === -1) {
      return false;
    }

    if (hexColor) {
      const normalizedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;
      if (!isValidHexColor(normalizedHex)) {
        return false;
      }
      
      const updatedColors = [...colorSystem.customAccentColors];
      updatedColors[colorIndex] = {
        ...updatedColors[colorIndex],
        name: name.trim(),
        hexValue: normalizedHex.toUpperCase()
      };

      setColorSystem(prev => ({
        ...prev,
        customAccentColors: updatedColors
      }));
    } else {
      const updatedColors = [...colorSystem.customAccentColors];
      updatedColors[colorIndex] = {
        ...updatedColors[colorIndex],
        name: name.trim()
      };

      setColorSystem(prev => ({
        ...prev,
        customAccentColors: updatedColors
      }));
    }

    return true;
  };

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

  const removeLightBackground = (key: string): boolean => {
    const backgroundToRemove = colorSystem.customLightBackgrounds.find(b => b.key === key);
    if (!backgroundToRemove || !backgroundToRemove.isCustom) {
      return false;
    }

    setColorSystem(prev => ({
      ...prev,
      customLightBackgrounds: prev.customLightBackgrounds.filter(b => b.key !== key)
    }));

    return true;
  };

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

  const removeDarkBackground = (key: string): boolean => {
    const backgroundToRemove = colorSystem.customDarkBackgrounds.find(b => b.key === key);
    if (!backgroundToRemove || !backgroundToRemove.isCustom) {
      return false;
    }

    setColorSystem(prev => ({
      ...prev,
      customDarkBackgrounds: prev.customDarkBackgrounds.filter(b => b.key !== key)
    }));

    return true;
  };

  const value: ColorSystemContextType = {
    colorSystem,
    getAllAccentColors,
    getAllLightBackgrounds,
    getAllDarkBackgrounds,
    addCustomAccentColor,
    removeAccentColor,
    updateAccentColor,
    addLightBackground,
    removeLightBackground,
    addDarkBackground,
    removeDarkBackground,
  };

  return (
    <ColorSystemContext.Provider value={value}>
      {children}
    </ColorSystemContext.Provider>
  );
};

export const useColorSystemContext = () => {
  const context = useContext(ColorSystemContext);
  if (context === undefined) {
    throw new Error('useColorSystemContext must be used within a ColorSystemProvider');
  }
  return context;
};