// This file contains fixes for button styling issues

// Common button styles that should be used instead of CSS variables
export const buttonStyles = {
  primary: 'bg-[#003AB7] text-white hover:bg-[#002A8F] transition-colors',
  secondary: 'bg-[#F8F9FA] text-[#003AB7] hover:bg-[#003AB7] hover:text-white transition-colors border border-[#558EFF]',
  accent: 'bg-[#558EFF] text-white hover:bg-[#447DFF] transition-colors',
  destructive: 'bg-[#DC3545] text-white hover:bg-[#C82333] transition-colors',
  outline: 'border border-[#558EFF] text-[#003AB7] hover:bg-[#003AB7] hover:text-white transition-colors',
  ghost: 'text-[#003AB7] hover:bg-[#F8F9FA] transition-colors',
  success: 'bg-[#28A745] text-white hover:bg-[#218838] transition-colors',
  warning: 'bg-[#FFC107] text-[#000000] hover:bg-[#E0A800] transition-colors',
  gradient: 'bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white hover:from-[#002A8F] hover:to-[#447DFF] transition-all'
};

// Fix function to replace problematic button classes
export const fixButtonClass = (originalClass: string): string => {
  return originalClass
    .replace(/bg-primary/g, 'bg-[#003AB7]')
    .replace(/hover:bg-primary/g, 'hover:bg-[#002A8F]')
    .replace(/text-primary/g, 'text-[#003AB7]')
    .replace(/bg-secondary/g, 'bg-[#F8F9FA]')
    .replace(/text-secondary/g, 'text-[#003AB7]')
    .replace(/bg-accent/g, 'bg-[#558EFF]')
    .replace(/hover:bg-accent/g, 'hover:bg-[#447DFF]')
    .replace(/text-accent/g, 'text-[#558EFF]')
    .replace(/bg-destructive/g, 'bg-[#DC3545]')
    .replace(/hover:bg-destructive/g, 'hover:bg-[#C82333]')
    .replace(/text-destructive/g, 'text-[#DC3545]')
    .replace(/border-primary/g, 'border-[#003AB7]')
    .replace(/ring-primary/g, 'ring-[#558EFF]');
};
