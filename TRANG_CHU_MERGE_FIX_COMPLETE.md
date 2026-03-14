# 🔧 Trang Chủ (UniversitiesList) Cost Column Merge Fix - Complete

## **Problem Identified**
The "Trang chủ" (UniversitiesList.tsx) page still had separate cost columns with dynamic fixed cost types and a separate "Tổng ước tính" column. This was causing confusion and not providing the unified cost display that was requested.

## **✅ Solution Implemented**

### **1. Updated Table Structure**
**Before:**
```html
<th>Tên trường</th>
<th>Tên tiếng Hàn</th>
<th>Quốc gia</th>
<th>Khu vực</th>
<!-- DYNAMIC: Fixed cost columns -->
<th>Học phí</th>
<th>Phí ở</th>
<th>Bảo hiểm</th>
<th>Tổng ước tính</th>
```

**After:**
```html
<th>Tên trường</th>
<th>Tên tiếng Hàn</th>
<th>Quốc gia</th>
<th>Khu vực</th>
<th>
  <div className="flex items-center justify-end gap-2">
    <Calculator className="w-4 h-4" />
    Tổng chi phí ước tính
    <SortIcon />
  </div>
</th>
```

### **2. Enhanced Cost Calculation**
Added inline cost calculation logic that:
- **Supports Legacy Structure**: Calculates from `generalTuition`, `visaFee`, `accommodationFee`, `insuranceFee`, `additionalFees`
- **Supports New Systems**: Calculates from `systems.fees` JSONB structure
- **Handles All Fee Types**: Fixed, optional, optional_multiple, percentage, variable_time
- **Intelligent Fallback**: Uses systems-based calculation when available, otherwise uses legacy

### **3. Merged Column Display**
```typescript
<TableCell className="text-right">
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center justify-end gap-2 cursor-help">
        <DollarSign className="w-4 h-4 text-slate-400" />
        <div>
          <div className="font-semibold text-blue-600">
            {formatFrom(cost?.amount || 0, 'VND')}
          </div>
          {(cost?.systemsIncluded.length || 0) > 0 && (
            <div className="text-xs text-slate-600">
              {cost?.systemsIncluded.join(', ') || ''}
            </div>
          )}
        </div>
      </div>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <pre className="text-xs whitespace-pre-wrap">
        {generateSimpleCostTooltip(cost || { amount: 0, currency: 'VND', systemsIncluded: [] })}
      </pre>
    </TooltipContent>
  </Tooltip>
</TableCell>
```

### **4. Rich Tooltip Information**
The tooltip now displays:
- **Total Cost**: Formatted amount in VND
- **Systems Included**: Available systems (D4-1, D2-2, D2-3, etc.)
- **Currency Information**: VND with proper formatting

### **5. Sorting Functionality**
Updated sorting to work with the new cost column:
```typescript
// Sort by cost
filtered.sort((a, b) => {
  const costA = costCalculations.get(a.id)?.amount || 0;
  const costB = costCalculations.get(b.id)?.amount || 0;
  return sortOrder === 'asc' ? costA - costB : costB - costA;
});
```

### **6. Mobile View Enhancement**
Updated mobile cards to use the merged cost display:
```typescript
<div className="flex justify-between font-semibold">
  <span>Tổng chi phí ước tính</span>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center gap-2 cursor-help">
        <DollarSign className="w-4 h-4 text-slate-400" />
        <span className="text-blue-600">{formatFrom(cost?.amount || 0, 'VND')}</span>
      </div>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <pre className="text-xs whitespace-pre-wrap">
        {generateSimpleCostTooltip(cost || { amount: 0, currency: 'VND', systemsIncluded: [] })}
      </pre>
    </TooltipContent>
  </Tooltip>
</div>
```

## **🎯 Key Features Delivered**

### **✅ Merged Column Display**
- **Single Column**: Replaced dynamic fixed cost columns and separate total with single "Tổng chi phí ước tính" column
- **Calculator Icon**: Visual indicator for cost column
- **Sortable**: Click to sort ascending/descending by cost
- **Hover Effects**: Interactive cursor and highlighting

### **✅ Enhanced Cost Display**
- **Primary Amount**: Bold, blue-colored total cost
- **Systems Information**: Shows included systems when available
- **Currency Formatting**: Proper VND formatting with locale
- **Tooltip Support**: Rich information on hover

### **✅ Intelligent Calculations**
- **Dual Support**: Works with both legacy and new systems-based structures
- **Fee Type Support**: Handles all 5 fee types (fixed, optional, optional_multiple, percentage, variable_time)
- **Default Selections**: Includes default optional fees and options
- **Error Handling**: Graceful fallback for missing data

### **✅ Real-time Updates**
- **Automatic Recalculation**: Costs update when university data changes
- **Efficient Caching**: Calculations memoized for performance
- **Error Recovery**: Default values when calculation fails

## **📊 Visual Improvements**

### **Before vs After**

**Before (Desktop):**
```
| Tên trường | Tên tiếng Hàn | Quốc gia | Khu vực | Học phí | Phí ở | Bảo hiểm | Tổng ước tính |
|-----------|---------------|----------|---------|----------|--------|----------|---------------|
| Ajou      | 아주대학교      | Korea   | Suwon   | 39M      | 5M     | 2M       | 46M           |
```

**After (Desktop):**
```
| Tên trường | Tên tiếng Hàn | Quốc gia | Khu vực | Tổng chi phí ước tính |
|-----------|---------------|----------|---------|--------------------|
| Ajou      | 아주대학교      | Korea   | Suwon   | 💰 95,200,000 ₫     |
|           |               |          |         | Systems: D4-1, D2-2 |
```

**Before (Mobile):**
```
Ajou University
아주대학교
Quốc gia: Korea
Khu vực: Suwon
Học phí: 39M
Phí ở: 5M
Bảo hiểm: 2M
Tổng ước tính: 46M
```

**After (Mobile):**
```
Ajou University
아주대학교
Quốc gia: Korea
Khu vực: Suwon
Tổng chi phí ước tính: 💰 95,200,000 ₫
Hệ thống: D4-1, D2-2
```

## **🔧 Technical Implementation**

### **Cost Calculation Logic**
```typescript
function calculateSimpleUniversityCost(university: any): SimpleCostCalculation {
  // Legacy calculation
  const legacyTotal = generalTuition + visaFee + accommodationFee + insuranceFee + additionalFees;
  
  // Systems calculation
  let systemsTotal = 0;
  let systemsIncluded: string[] = [];
  
  if (university.systems && Array.isArray(university.systems)) {
    const availableSystems = university.systems.filter(system => system.available);
    systemsIncluded = availableSystems.map(system => system.code);
    
    availableSystems.forEach(system => {
      system.fees.forEach(fee => {
        let feeAmount = 0;
        switch (fee.type) {
          case 'fixed': feeAmount = fee.base_value; break;
          case 'optional': 
            if (fee.required || fee.default_selected) feeAmount = fee.base_value; 
            break;
          case 'optional_multiple':
          case 'variable_time':
            const defaultOption = fee.options?.find(opt => opt.id === fee.default_selected) || fee.options?.[0];
            if (defaultOption) feeAmount = defaultOption.value;
            break;
          case 'percentage':
            const defaultCondition = fee.conditions?.[0];
            if (defaultCondition) feeAmount = -((fee.base_value) * (defaultCondition.percentage)) / 100;
            break;
        }
        systemsTotal += feeAmount;
      });
    });
  }
  
  // Use systems-based if available, otherwise legacy
  const totalAmount = systemsTotal > 0 ? systemsTotal : legacyTotal;
  
  return { amount: totalAmount, currency: 'VND', systemsIncluded };
}
```

## **🚀 Result**

The Trang chủ (UniversitiesList) page now successfully displays a **merged "Tổng chi phí ước tính" column** that:

1. **Combines** all cost types into a single display
2. **Calculates** from both legacy and new systems-based structures
3. **Shows** rich tooltip information on hover
4. **Supports** sorting by total cost
5. **Updates** automatically when data changes
6. **Provides** clear visual indicators and proper formatting
7. **Works** on both desktop and mobile views

**✅ The issue with the Trang chủ columns not being merged has been completely resolved!**

## **📋 Summary of All Pages Fixed**

1. ✅ **AdminDashboard.tsx** - Merged cost columns with enhanced display
2. ✅ **UniversitiesList.tsx** - Merged cost columns with enhanced display
3. ✅ **Both pages now show** unified "Estimated Total Cost" with tooltips and systems information

**🎯 All cost column merge issues across the SACMA app have been successfully resolved!**
