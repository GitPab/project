# SACMA Visa Systems Fix - Complete Implementation

## Problem Summary
From your screenshots, the issues were:
1. **System costs showing 0 đ** - Fees weren't being read from the `systems` JSONB array
2. **Duplication in display** - Fixed costs, system costs, and tuition showing separately
3. **Optional costs without prices** - Checkboxes showed but prices weren't displayed
4. **Sync issues** - Changes in edit modal didn't reflect in details page

## Root Cause
The `useFees` hook was looking for a `fees` column in the `universities` table, but the new flexible fee structure stores fees within the `systems` JSONB array. Each system (D4-1, D2-2, etc.) has its own array of fees.

## Solution Implemented

### 1. Fixed useFees Hook (src/hooks/useFees.ts)

```typescript
// Fetch fees from systems array instead of non-existent fees column
const { data, error: fetchError } = await supabase
  .from('universities')
  .select('systems')  // <-- Changed from 'fees' to 'systems'
  .eq('id', universityId)
  .single();

// Extract and flatten fees from all available systems
if (data?.systems && Array.isArray(data.systems)) {
  const allFees: FlexibleFee[] = [];
  
  data.systems.forEach((system: UniversitySystem) => {
    if (system.fees && Array.isArray(system.fees)) {
      system.fees.forEach((fee: FlexibleFee) => {
        // Add system context to fee for filtering
        const feeWithSystem = {
          ...fee,
          id: `${system.code}_${fee.id}`,  // Unique ID with system prefix
          originalId: fee.id,
          applies_to: [system.code],  // For visa type filtering
          systemCode: system.code,
          systemName: system.name,
        };
        allFees.push(feeWithSystem);
      });
    }
  });
  
  setFees(allFees);
}
```

### 2. Realtime Subscription for Immediate Sync

```typescript
// Listen for changes to systems column
const channel = supabase
  .channel(`systems-changes-${universityId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'universities',
      filter: `id=eq.${universityId}`
    },
    (payload: any) => {
      if (payload.new && 'systems' in payload.new) {
        // Re-extract fees from updated systems
        const newSystems = payload.new.systems as UniversitySystem[];
        // ... update fees state
      }
    }
  )
  .subscribe();
```

### 3. Updated FlexibleFee Type (src/types/fees.ts)

```typescript
export interface FlexibleFee {
  // ... existing fields ...
  
  // System context properties (added at runtime)
  originalId?: string;
  systemCode?: string;
  systemName?: string;
}
```

### 4. Fixed Fee Filtering by Visa Type

```typescript
// Filter fees by selected visa type
const applicableFees = fees.filter(fee => 
  !selectedVisaType || 
  !fee.applies_to || 
  fee.applies_to.includes(selectedVisaType)
);
```

## Files Modified

1. **src/hooks/useFees.ts** - Reads from systems array, adds realtime sync
2. **src/types/fees.ts** - Added system context properties to FlexibleFee
3. **src/app/components/EditUniversityModalNew.tsx** - Already implemented correctly
4. **src/app/pages/MyCostsDynamic.tsx** - Uses useFees hook correctly

## Testing Instructions

1. **Open the Edit Modal**
   - Go to Admin → Universities
   - Click "Sửa" on any university
   - You should see the modal with visa system buttons (D4-1, D2-1, etc.)

2. **Add Systems and Fees**
   - Click "D4-1" button to add D4-1 system
   - Toggle "Available" switch to ON
   - Click "Thêm phí" to add fees
   - Enter fee name (e.g., "Học phí"), value (e.g., 52000000), currency (KRW)
   - Click "Lưu thay đổi"

3. **Verify Realtime Sync**
   - Open My Costs page in another tab
   - Select the same university
   - Select D4-1 system
   - The costs should update immediately without refresh

4. **Check Display**
   - Fixed costs should show correctly
   - System costs (D4-1, D2-2, etc.) should show actual values, not 0
   - Optional add-ons should show prices with checkboxes

## Database Schema

The `systems` column in `universities` table is a JSONB array:

```json
[
  {
    "id": "system-123",
    "code": "D4-1",
    "name": "D4-1 (Thẳng lên - 4 năm)",
    "available": true,
    "description": "Chương trình đại học 4 năm",
    "fees": [
      {
        "id": "fee-456",
        "name": "Học phí",
        "type": "fixed",
        "base_value": 52000000,
        "currency": "KRW",
        "category": "tuition",
        "required": true
      }
    ]
  }
]
```

## Expected Results After Fix

**Before:**
- D4-1 system cost: 0 đ
- Tuition range: 0 đ - 0 đ
- Optional add-ons: No prices shown

**After:**
- D4-1 system cost: 52.000.000 KRW (or converted VND)
- Tuition range: Shows actual values from database
- Optional add-ons: Shows prices with checkboxes
- Real-time updates when admin changes fees

## Build Status
✅ Build completed successfully
