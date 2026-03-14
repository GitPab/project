// New White-Red-Blue Button Color Scheme
export const buttonColorScheme = {
  // Primary buttons - Red theme
  primary: 'bg-[#DC3545] text-white hover:bg-[#C82333] transition-colors',
  
  // Secondary buttons - White with red accent
  secondary: 'bg-white text-[#DC3545] hover:bg-[#DC3545] hover:text-white transition-colors border border-[#DC3545]',
  
  // Accent buttons - Blue theme
  accent: 'bg-[#003AB7] text-white hover:bg-[#002A8F] transition-colors',
  
  // Success buttons - Green theme
  success: 'bg-[#28A745] text-white hover:bg-[#218838] transition-colors',
  
  // Outline buttons - Red outline
  outline: 'border border-[#DC3545] text-[#DC3545] hover:bg-[#DC3545] hover:text-white transition-colors',
  
  // Ghost buttons - Red text
  ghost: 'text-[#DC3545] hover:bg-[#FFF5F5] transition-colors',
  
  // Gradient buttons - Red to Blue gradient
  gradient: 'bg-gradient-to-r from-[#DC3545] to-[#003AB7] text-white hover:from-[#C82333] hover:to-[#002A8F] transition-all'
};

// Color replacement function
export const updateToNewColorScheme = (originalClass: string): string => {
  return originalClass
    // Replace blue primary with red primary
    .replace(/bg-\[#003AB7\]/g, 'bg-[#DC3545]')
    .replace(/hover:bg-\[#002A8F\]/g, 'hover:bg-[#C82333]')
    .replace(/text-\[#003AB7\]/g, 'text-[#DC3545]')
    
    // Replace blue accent with blue accent (keep blue for accent)
    .replace(/bg-\[#558EFF\]/g, 'bg-[#003AB7]')
    .replace(/hover:bg-\[#447DFF\]/g, 'hover:bg-[#002A8F]')
    .replace(/text-\[#558EFF\]/g, 'text-[#003AB7]')
    
    // Update gradients
    .replace(/from-\[#003AB7\] to-\[#558EFF\]/g, 'from-[#DC3545] to-[#003AB7]')
    .replace(/hover:from-\[#002A8F\] hover:to-\[#447DFF\]/g, 'hover:from-[#C82333] hover:to-[#002A8F]')
    
    // Update borders
    .replace(/border-\[#558EFF\]/g, 'border-[#DC3545]')
    .replace(/border-\[#003AB7\]/g, 'border-[#DC3545]');
};
