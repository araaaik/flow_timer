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
    return DEFAULT_LIGHT_BACKGROUNDS;
  };

  const getAllDarkBackgrounds = (): BackgroundColor[] => {
    return DEFAULT_DARK_BACKGROUNDS;
  };

  // Actions
  const addCustomAccentColor = (name: string, hexColor: string): AccentColor | null => {
    const normalizedHex = hexColor.startsWith('#') ? hexColor : `#${hexColor}`;

    if (!isValidHexColor(normalizedHex)) {
      return null;
    }

    if (colorSystem.customAccentColors.length >= 5) {
      //  Ideally, display an error message here, but I can't directly.
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
    if (!colorToRemove) {
      return false;
    }

    if (!colorToRemove.isCustom) {
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



  const value: ColorSystemContextType = {
    colorSystem,
    getAllAccentColors,
    getAllLightBackgrounds,
    getAllDarkBackgrounds,
    addCustomAccentColor,
    removeAccentColor,
    updateAccentColor,
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