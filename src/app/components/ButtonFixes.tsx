// Comprehensive button hover state fixes

// Enhanced button styles with proper hover states
export const enhancedButtonStyles = {
  // Primary white buttons with blue
  primaryWhite: 'bg-white text-[#003AB7] border border-[#003AB7] rounded-lg hover:bg-[#003AB7] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md',
  
  // Gradient buttons
  primaryGradient: 'bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white rounded-lg hover:from-[#002A8F] hover:to-[#447DFF] transition-all duration-200 shadow-md hover:shadow-lg',
  
  // Solid blue buttons
  primaryBlue: 'bg-[#003AB7] text-white rounded-lg hover:bg-[#002A8F] transition-all duration-200 shadow-md hover:shadow-lg',
  
  // Small buttons
  smallPrimary: 'bg-white text-[#003AB7] border border-[#003AB7] px-4 py-2 rounded-lg hover:bg-[#003AB7] hover:text-white transition-all duration-200',
  
  // Large buttons
  largePrimary: 'bg-white text-[#003AB7] border border-[#003AB7] px-8 py-3 rounded-lg hover:bg-[#003AB7] hover:text-white transition-all duration-200 shadow-md hover:shadow-lg',
  
  // Icon buttons
  iconButton: 'p-2 bg-white text-[#003AB7] border border-[#003AB7] rounded-lg hover:bg-[#003AB7] hover:text-white transition-all duration-200',
  
  // Ghost buttons
  ghost: 'text-[#003AB7] hover:bg-[#F0F7FF] px-4 py-2 rounded-lg transition-all duration-200',
  
  // Disabled state
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none'
};

// Fix function for common button issues
export const fixButtonHover = (buttonClass: string): string => {
  return buttonClass
    // Ensure transition duration is specified
    .replace(/transition-colors/g, 'transition-all duration-200')
    .replace(/transition-colors/g, 'transition-all duration-200')
    // Add shadow on hover if missing
    .replace(/hover:bg-\[#003AB7\] hover:text-white(?!.*shadow)/g, 'hover:bg-[#003AB7] hover:text-white shadow-md hover:shadow-lg')
    // Fix any missing hover states
    .replace(/bg-white text-\[#003AB7\](?!.*hover)/g, 'bg-white text-[#003AB7] hover:bg-[#003AB7] hover:text-white')
    // Ensure proper border styling
    .replace(/border-\[#003AB7\](?!.*bg-white)/g, 'border-[#003AB7] bg-white');
};

// Common button patterns to fix
export const buttonPatterns = {
  // Fix buttons that disappear on hover
  noDisappear: 'transition-all duration-200 transform hover:scale-105',
  
  // Fix buttons that don't change color
  alwaysVisible: 'hover:bg-[#003AB7] hover:text-white',
  
  // Fix buttons with poor contrast
  betterContrast: 'shadow-md hover:shadow-lg border border-[#003AB7]/20'
};
