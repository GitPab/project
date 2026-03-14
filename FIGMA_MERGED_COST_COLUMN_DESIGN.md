# 🎨 Figma Design Specifications: Merged "Estimated Total Cost" Column

## **Current State Analysis**
The existing Universities List table has separate "General Cost" and "Additional Fees" columns, which creates confusion and doesn't provide a comprehensive view of total costs. The enhancement merges these into a single "Estimated Total Cost" column with intelligent calculations and rich tooltip information.

## **Design Requirements for Enhanced Table**

### **1. Table Layout Structure**
```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 🎓 Universities List - Enhanced Cost Display                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 [Search universities...]  🌍 [Country ▼]  ⭐ [Tier ▼]  🔄 [Refresh]            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ 📊 156 universities found                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ University Name ──┬─ Estimated Total Cost ──┬─ Country ──┬─ Tier ──┬─ Actions ──┐ │
│ │ 📚 Ajou University │ 💰 95,200,000 ₫         │ 🇰🇷 Korea │ Top 2  │ [View]    │ │
│ │                    │ 📊 85M - 110M ₫        │          │        │           │ │
│ │                    │ 🏫 D4-1, D2-2, D2-3     │          │        │           │ │
│ ├────────────────────┼─────────────────────────┼──────────┼────────┼───────────┤ │
│ │ 📚 KonKuk University│ 💰 78,500,000 ₫         │ 🇰🇷 Korea │ Top 1  │ [View]    │ │
│ │                    │ 📊 70M - 87M ₫          │          │        │           │ │
│ │                    │ 🏫 D4-1, D2-2           │          │        │           │ │
│ ├────────────────────┼─────────────────────────┼──────────┼────────┼───────────┤ │
│ │ 📚 Yonsei University│ 💰 120,000,000 ₫        │ 🇰🇷 Korea │ Top 1  │ [View]    │ │
│ │                    │ 📊 110M - 130M ₫        │          │        │           │ │
│ │                    │ 🏫 D4-1, D2-2, D2-3, D2-6 │          │        │           │ │
│ └────────────────────┴─────────────────────────┴──────────┴────────┴───────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### **2. Enhanced Cost Column Design**

#### **Primary Display**
```
┌─────────────────────────────────────────┐
│ 💰 95,200,000 ₫                         │
│ 📊 85M - 110M ₫                        │
│ 🏫 D4-1, D2-2, D2-3                    │
└─────────────────────────────────────────┘
```

**Visual Elements:**
- **💰 Icon**: Calculator or Dollar Sign icon for cost identification
- **Primary Amount**: Bold, prominent display in blue (#003AB7)
- **Range Display**: Smaller text showing min-max when multiple systems exist
- **Systems Badge**: Compact chips showing included systems
- **Hover State**: Subtle border highlight and cursor pointer

#### **Tooltip Content on Hover**
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Estimated Total Cost: 95,200,000 ₫                        │
├─────────────────────────────────────────────────────────────┤
│ 📊 Range: 85,000,000 ₫ - 110,000,000 ₫                      │
│ 📈 Average: 95,200,000 ₫                                    │
│ 🏫 Systems: D4-1, D2-2, D2-3                                │
├─────────────────────────────────────────────────────────────┤
│ 📋 Cost Breakdown:                                           │
│                                                             │
│ 💼 Fixed Fees - Tuition:                                    │
│   • Học phí tiếng Hàn: 18,000,000 ₫                         │
│   • Phí tư vấn: 39,000,000 ₫                                │
│   • Phí apply: 1,777,000 ₫                                 │
│                                                             │
│ ➕ Optional Fees - Accommodation:                           │
│   • Ký túc xá (Phòng 2 người): 5,100,000 ₫ (6 tháng)       │
│   • Bảo hiểm y tế: 2,000,000 ₫                              │
│                                                             │
│ 🎓 Scholarships - TOPIK:                                    │
│   • TOPIK 4 cấp: -12,500,000 ₫ (50% giảm)                  │
│                                                             │
│ 📊 Total: 95,200,000 ₫                                      │
│ 💵 USD: $3,808 | 🇰🇷 KRW: 5.1M | 🇯🇵 JPY: 580K             │
└─────────────────────────────────────────────────────────────┘
```

### **3. Visual Design System**

#### **Color Palette**
- **Primary Blue**: `#003AB7` (main cost amount)
- **Success Green**: `#10B981` (discounts, savings)
- **Warning Amber**: `#F59E0B` (range indicators)
- **Neutral Gray**: `#64748B` (secondary information)
- **Background**: `#F8FAFC` (hover states)

#### **Typography**
- **Primary Amount**: Inter, Bold, 16px, `#003AB7`
- **Range Text**: Inter, Medium, 12px, `#64748B`
- **Systems Badge**: Inter, Regular, 10px, `#64748B`
- **Tooltip Headers**: Inter, Semi-Bold, 14px
- **Tooltip Content**: Inter, Regular, 12px

#### **Spacing & Layout**
- **Column Width**: 200px minimum, expandable
- **Icon Size**: 16px
- **Badge Padding**: 4px 8px
- **Tooltip Width**: 320px maximum
- **Line Height**: 1.4 for readability

### **4. Interactive Elements**

#### **Hover States**
```css
.cost-column {
  transition: all 0.2s ease;
  cursor: pointer;
}

.cost-column:hover {
  background-color: #F1F5F9;
  border-radius: 4px;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

#### **Tooltip Behavior**
- **Trigger**: Hover on cost column
- **Delay**: 300ms before showing
- **Duration**: Stay visible while hovering
- **Animation**: Fade in/out (200ms)
- **Position**: Top-left aligned with column

#### **Loading States**
```
┌─────────────────────────────────────────┐
│ ⏳ Calculating...                       │
│ 🔄 Updating costs...                   │
└─────────────────────────────────────────┘
```

### **5. Responsive Design**

#### **Desktop (> 1024px)**
- **Full Table**: All columns visible
- **Rich Tooltips**: Complete breakdown with all details
- **Hover Interactions**: Full hover states and transitions

#### **Tablet (768px - 1024px)**
- **Adaptive Width**: Cost column adjusts to 180px
- **Compact Tooltips**: Reduced padding, essential info only
- **Touch Targets**: Larger tap areas (44px minimum)

#### **Mobile (< 768px)**
```
┌─────────────────────────────────────┐
│ 📚 Ajou University                  │
│ 🇰🇷 Korea • Top 2                   │
│ 💰 95.2M ₫                          │
│ 📊 85M - 110M ₫                     │
│ 🏫 D4-1, D2-2, D2-3                 │
│ [View Details]                      │
└─────────────────────────────────────┘
```

### **6. Data Visualization**

#### **Cost Indicators**
```css
.cost-high {
  color: #DC2626; /* Red for costs > 100M */
}

.cost-medium {
  color: #F59E0B; /* Amber for costs 50M-100M */
}

.cost-low {
  color: #10B981; /* Green for costs < 50M */
}
```

#### **Range Visualization**
```
┌─────────────────────────────────────────┐
│ 💰 95,200,000 ₫                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 85M                    110M             │
│ ◯───────────────────────◯               │
│ Average                              │
└─────────────────────────────────────────┘
```

### **7. Sorting and Filtering**

#### **Sort Indicators**
```
┌─────────────────────────────────────────┐
│ Estimated Total Cost ↗                  │
│ (Click to toggle asc/desc)              │
└─────────────────────────────────────────┘
```

#### **Filter Integration**
- **Cost Range Slider**: Filter by minimum/maximum costs
- **System Filter**: Show only universities with specific systems
- **Country Filter**: Filter by country with cost averages

### **8. Accessibility Features**

#### **Screen Reader Support**
```html
<div 
  role="button" 
  tabindex="0"
  aria-label="Estimated total cost: 95,200,000 Vietnamese Dong. Range: 85 to 110 million. Available systems: D4-1, D2-2, D2-3. Press Enter or Space to view detailed breakdown."
  aria-describedby="cost-tooltip"
>
  <!-- Cost content -->
</div>
```

#### **Keyboard Navigation**
- **Tab Order**: Logical progression through cost columns
- **Enter/Space**: Trigger tooltip display
- **Escape**: Close tooltips
- **Arrow Keys**: Navigate between universities

#### **Color Contrast**
- **Primary Text**: 4.5:1 minimum contrast ratio
- **Secondary Text**: 3:1 minimum contrast ratio
- **Hover States**: Enhanced contrast for active elements

### **9. Performance Considerations**

#### **Data Loading**
```typescript
// Progressive loading strategy
const loadCostCalculations = async () => {
  // Load basic university info first
  const universities = await loadUniversities();
  
  // Load cost calculations in background
  const costPromises = universities.map(u => calculateCost(u.id));
  const costs = await Promise.all(costPromises);
  
  // Update UI with cost data
  updateCostDisplay(costs);
};
```

#### **Tooltip Optimization**
- **Debounced Calculations**: Prevent excessive recalculations
- **Cached Results**: Store calculated tooltips
- **Lazy Loading**: Load detailed breakdowns on demand

### **10. Component Library Integration**

#### **Design Tokens**
```css
:root {
  --cost-primary-color: #003AB7;
  --cost-secondary-color: #64748B;
  --cost-success-color: #10B981;
  --cost-warning-color: #F59E0B;
  --cost-error-color: #DC2626;
  --cost-background-hover: #F1F5F9;
  --cost-border-radius: 4px;
  --cost-transition: all 0.2s ease;
}
```

#### **Component Variants**
- **CostColumn**: Default, Loading, Error, High/Medium/Low
- **CostTooltip**: Standard, Compact, Mobile
- **CostBadge**: System indicators, Range indicators

### **11. Animation Specifications**

#### **Column Animations**
```css
@keyframes cost-update {
  0% { opacity: 0.5; transform: scale(0.98); }
  50% { opacity: 0.8; transform: scale(1.01); }
  100% { opacity: 1; transform: scale(1); }
}

.cost-updating {
  animation: cost-update 0.6s ease-in-out;
}
```

#### **Tooltip Animations**
```css
@keyframes tooltip-fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes tooltip-fade-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-4px); }
}
```

### **12. Error Handling**

#### **Error States**
```
┌─────────────────────────────────────────┐
│ ❌ Cost calculation failed             │
│ 🔄 Retry calculation                   │
│ 📞 Contact support                     │
└─────────────────────────────────────────┘
```

#### **Fallback Display**
```
┌─────────────────────────────────────────┐
│ 💰 Contact for pricing                 │
│ 📧 Email: info@sacma.com              │
│ 📞 Phone: +84 123 456 789              │
└─────────────────────────────────────────┘
```

---

## **🎯 Implementation Guidelines**

### **1. Component Structure**
```typescript
interface CostColumnProps {
  university: University;
  calculation: EstimatedTotalCost;
  onHover?: (cost: EstimatedTotalCost) => void;
  loading?: boolean;
  error?: string;
}

const CostColumn: React.FC<CostColumnProps> = ({
  university,
  calculation,
  onHover,
  loading,
  error
}) => {
  // Implementation
};
```

### **2. Integration Points**
- **Real-time Updates**: Supabase subscriptions for cost changes
- **Currency Conversion**: Multi-currency support in tooltips
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Debounced calculations and caching

### **3. Testing Strategy**
- **Unit Tests**: Cost calculation logic
- **Integration Tests**: Tooltip behavior and data flow
- **Accessibility Tests**: Screen reader compatibility
- **Performance Tests**: Large dataset handling

---

**🎯 This design specification provides a comprehensive guide for creating an enhanced "Estimated Total Cost" column that merges general and additional costs into a single, informative, and interactive display. The design prioritizes clarity, accessibility, and performance while providing rich detail through intelligent tooltips and visual indicators.**
