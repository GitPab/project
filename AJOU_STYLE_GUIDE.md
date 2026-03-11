# Ajou-Style UI Design Guide

## Overview

The Ajou-style UI separates **university information** from **cost details**, creating a progressive disclosure pattern that helps students understand programs before diving into financial details.

## Design Principles

### 1. Progressive Information Architecture

```
Information Flow:
Discovery (List) → Overview (Detail Top) → Costs (Detail Bottom)
```

- **Discovery Phase**: Cards show only intro (name, location, tagline, ranking)
- **Overview Phase**: Common university info without costs
- **Cost Phase**: Detailed breakdown with calculator

### 2. Cost Categorization

All costs are organized into clear categories:

#### For Korean Universities (Ajou Model):

```
📊 COST BREAKDOWN STRUCTURE

┌─────────────────────────────────────┐
│  TOP SECTION                        │
│  ✅ University Name & Location      │
│  ✅ Rankings & Address              │
│  ✅ Academic Programs                │
│  ✅ Overview                         │
│  ❌ NO COSTS HERE                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  VISA SYSTEM SELECTOR               │
│  [D4-1]  [D2-2]  [D2-3]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🔴 FIXED COSTS                     │
│  (Always included)                  │
│  • Consulting Fee: 39M VND          │
│  • Agency Fees: 11M VND             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🔵 SYSTEM-SPECIFIC COSTS           │
│  (Based on selected visa)           │
│  • Application Fee: 100K KRW        │
│  • Tuition: 1.45M KRW/term          │
│  • Yearly Fee: 5.8M KRW             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🟢 OPTIONAL ADD-ONS                │
│  (Checkboxes)                       │
│  ☐ Korean Language Course           │
│  ☐ Dorm VN (dropdown: 1-6 months)   │
│  ☐ Dorm KR (radio: 4/2 person)      │
│  ☐ Savings Account (8-10M KRW)      │
│  ☐ Flight Ticket: 8M VND            │
│  ☐ Scholarship (30-100% off)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💰 REAL-TIME CALCULATOR            │
│  Total: 5,800,000 KRW               │
│  ~ 148,000,000 VND | ~ $3,945 USD   │
└─────────────────────────────────────┘
```

#### For Traditional Universities:

```
📊 COST BREAKDOWN STRUCTURE

┌─────────────────────────────────────┐
│  TOP SECTION                        │
│  ✅ University Info                 │
│  ✅ Rankings & Programs             │
│  ❌ NO COSTS HERE                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💰 COSTS SECTION                   │
│  • Tuition: $4,500                  │
│  • Visa Fee: $150                   │
│  • Accommodation: $3,000            │
│  • Insurance: $800                  │
│  ─────────────────────────────      │
│  Total: $8,450                      │
│  ~ 221,128,050 VND | ~ 12,427,950 KRW│
└─────────────────────────────────────┘
```

## Visual Design Elements

### Color Coding

- 🔴 **Red (Fixed Costs)**: `bg-red-100`, `text-red-600`
- 🔵 **Blue (System Costs)**: `bg-blue-100`, `text-blue-600`
- 🟢 **Green (Add-ons)**: `bg-green-100`, `text-green-600`
- 💰 **Gold (Total)**: `bg-gradient-to-r from-blue-50 to-blue-100`

### Typography

```css
/* Headings */
Section Title: text-2xl font-bold text-slate-900
Subsection: text-lg font-semibold text-slate-900
Labels: text-sm font-medium text-slate-700

/* Body */
Description: text-slate-600
Values: font-semibold text-slate-900
Currency: text-sm text-slate-600
```

### Spacing

```css
/* Cards */
padding: 1.5rem (p-6)
gap: 2rem (space-y-8)

/* List Items */
gap: 0.75rem (space-y-3)
padding: 0.75rem (p-3)
```

## Multi-Currency Display

### Format Examples

**Single Value:**
```
Primary: ₫221,128,050
Conversions: ~ $8,450 | ~ ₩12,427,950
```

**In Lists:**
```
Item Name                   ₫39,000,000
```

**In Totals:**
```
Total: ₫221,128,050
~ $8,450 USD | ~ ₩12,427,950 KRW
```

### Component Usage

```tsx
// For side-by-side display
<MultiCurrencyDisplay 
  amount={10000000} 
  baseCurrency="KRW" 
  compact={false}
/>

// For total with conversions
<TotalWithConversions 
  amount={calculateTotal} 
  baseCurrency={currency}
  label="Tổng chi phí ước tính"
/>
```

## Interactive Elements

### Visa System Selector

```tsx
<div className="grid md:grid-cols-3 gap-4">
  {systems.map((system) => (
    <button
      className={`p-4 rounded-lg border-2 ${
        selected ? 'border-primary bg-blue-50' : 'border-slate-200'
      }`}
    >
      <div className="font-semibold">{system.visaType}</div>
      <div className="text-sm text-slate-600">{system.description}</div>
    </button>
  ))}
</div>
```

### Optional Add-ons

```tsx
<div className="border rounded-lg p-4">
  <div className="flex items-start gap-3">
    <input type="checkbox" className="w-5 h-5" />
    <div className="flex-1">
      <label className="font-medium">{addon.nameVi}</label>
      
      {/* Conditional inputs */}
      {addon.requiresInput && (
        <select className="mt-2 w-full">
          {addon.options.map(opt => (
            <option value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      
      {addon.conditional && (
        <p className="text-xs text-amber-600">
          <Info /> {addon.conditional}
        </p>
      )}
    </div>
    <span className="font-semibold">{formatAmount}</span>
  </div>
</div>
```

### Accordion Sections

```tsx
<Accordion type="multiple" defaultValue={['fixed', 'system', 'addons']}>
  <AccordionItem value="fixed">
    <AccordionTrigger>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-lg">
          <Shield className="text-red-600" />
        </div>
        <div>
          <h3>Chi phí cố định</h3>
          <p className="text-sm">Luôn được tính vào tổng</p>
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      {/* Cost items */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Real-time Calculator

### Logic

```typescript
const calculateTotal = useMemo(() => {
  let total = 0;

  // 1. Add fixed costs
  fixedCosts.forEach(cost => {
    total += convertCurrencyAmount(cost.amount, cost.currency);
  });

  // 2. Add system-specific costs
  const visaSystem = getSelectedSystem();
  if (visaSystem.tuitionRange) {
    total += convertCurrencyAmount(visaSystem.tuitionRange.max, 'KRW');
  }

  // 3. Add selected add-ons
  Object.entries(selectedAddons).forEach(([id, isSelected]) => {
    if (isSelected) {
      const addon = getAddon(id);
      if (addon.type === 'scholarship') {
        // Subtract scholarship
        const discount = (tuition * percentage) / 100;
        total -= discount;
      } else {
        total += addonValue;
      }
    }
  });

  return total;
}, [selectedVisaType, selectedAddons, addonValues]);
```

### Display

```tsx
<div className="sticky bottom-6 z-10">
  <TotalWithConversions 
    amount={calculateTotal} 
    baseCurrency={currency}
    label="Tổng chi phí ước tính"
    className="shadow-xl"
  />
  
  <button className="w-full mt-4 px-6 py-4 bg-primary">
    <CheckCircle /> Đăng ký ngay
  </button>
</div>
```

## Responsive Behavior

### Desktop (≥768px)
- 3-column visa selector
- 2-column info grid
- Expanded accordions by default
- Side-by-side multi-currency

### Mobile (<768px)
- 1-column visa selector (stacked)
- 1-column info grid
- Collapsed accordions initially
- Compact multi-currency (parenthetical)

## Animation & Transitions

```css
/* Smooth transitions */
transition-all
transition-colors
transition-shadow

/* Hover effects */
hover:bg-slate-100
hover:shadow-lg
hover:border-primary

/* Active states */
border-primary bg-blue-50 (selected)
```

## Accessibility

- ✅ Semantic HTML (buttons, inputs, labels)
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Focus indicators (focus:ring-2)
- ✅ Color contrast compliance (WCAG AA)

## Best Practices

### DO ✅
- Show currency conversions for transparency
- Use progressive disclosure (top → costs)
- Provide real-time calculation feedback
- Include helpful tooltips for complex items
- Use consistent color coding

### DON'T ❌
- Mix costs with basic info at the top
- Show all costs upfront on list cards
- Hide important cost categories
- Use vague labels ("Other Fees")
- Forget to handle scholarship deductions

## Example Implementation

See `/src/app/pages/UniversityDetail.tsx` for complete implementation of the Ajou-style UI pattern.

---

**Design System Version**: 2.0 (Asia-Focus)
**Last Updated**: March 3, 2026
