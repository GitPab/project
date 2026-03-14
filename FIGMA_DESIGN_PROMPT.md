# Figma Design Prompt - SACMA Visa Systems UI

## Problem to Solve
From the user's screenshots:
- Screenshot 1: My Costs page shows D4-1 selected, Fixed Costs correct (39M + 1.777M = 40.777M), but System Costs showing "0" and "0 đ - 0 đ" for tuition
- Screenshot 2: Edit modal shows system buttons (D2-1, D2-6), Fixed cost 40.777.000 đ, System D4-1 cost 0 đ, Tuition 25.000.000 đ, Total 66.777.000 đ

Issues:
1. System costs showing 0 đ instead of actual values from database
2. Costs being duplicated/repeated in display
3. Optional add-ons showing checkboxes but no prices
4. Edit modal inputs need enabling

## Color Palette

### Primary Colors
- **Primary Blue**: #003AB7 (Main brand color, buttons, active states)
- **Primary Light**: #E8F0FE (Light backgrounds, hover states)
- **Primary Dark**: #002A8F (Hover states, emphasis)

### Accent Colors
- **Success Green**: #10B981 (Success messages, checkmarks)
- **Warning Amber**: #F59E0B (Optional items, notifications)
- **Error Red**: #EF4444 (Errors, delete actions)
- **Info Blue**: #3B82F6 (Information, tooltips)

### Neutral Colors
- **White**: #FFFFFF
- **Slate 50**: #F8FAFC
- **Slate 100**: #F1F5F9
- **Slate 200**: #E2E8F0
- **Slate 400**: #94A3B8
- **Slate 600**: #475569
- **Slate 900**: #0F172A

## Typography
- **Font**: Inter, system sans-serif
- **H1**: 24px Bold, Slate 900
- **H2**: 20px Semibold, Slate 900
- **H3**: 18px Medium, Slate 900
- **Body**: 14px Regular, Slate 600
- **Caption**: 12px Regular, Slate 500
- **Label**: 13px Medium, Slate 700

## Components

### 1. Visa System Selection Cards
**States**: Default (white, Slate 200 border), Selected (Blue 50 bg, 2px Primary Blue border), Disabled (50% opacity)

```
┌─────────────────────────────┐
│  D4-1                [✓]   │
│  Chương trình tiếng Hàn     │
│  [Available]                │
└─────────────────────────────┘
```

### 2. Fixed Costs Card (Red accent)
```
┌─────────────────────────────────────────┐
│ [🔴] Chi phí cố định        [Bắt buộc]  │
│ ─────────────────────────────────────── │
│ Phí tư vấn                  39.000.000đ │
│ Phí apply                    1.777.000đ │
└─────────────────────────────────────────┘
```

### 3. System Costs Card (Blue accent)
```
┌─────────────────────────────────────────┐
│ [📘] Chi phí theo hệ D4-1              │
│ Dựa trên visa system đã chọn           │
│ ─────────────────────────────────────── │
│ Học phí                     52.000.000 KRW│
│ (was showing 0 đ - now fixed!)         │
└─────────────────────────────────────────┘
```

### 4. Optional Add-ons (Green accent)
```
┌─────────────────────────────────────────┐
│ [🟢] Chi phí tùy chọn       [Tùy chọn] │
│ ─────────────────────────────────────── │
│ ☑ KTX (Ký túc xá)                      │
│   Phòng 4 người              3.000.000đ │
│ ☐ Vé máy bay                           │
│   Vietnam ↔ Korea            8.500.000đ │
│ ☐ Tài khoản tiết kiệm                  │
│   5 triệu VND                5.000.000đ │
└─────────────────────────────────────────┘
```

### 5. Edit University Modal
```
┌─────────────────────────────────────────────────────┐
│ [Building] Chỉnh sửa thông tin trường          [X]  │
├─────────────────────────────────────────────────────┤
│ THÔNG TIN CƠ BẢN                                   │
│ Tên trường: [Input field enabled]                  │
│ Tên tiếng Hàn: [Input field enabled]               │
│ Quốc gia: [South Korea - read only]                │
│ Khu vực: [Input field enabled]                     │
├─────────────────────────────────────────────────────┤
│ HỆ THỐNG VISA & CHI PHÍ                            │
│ [+ D4-1] [+ D2-1] [+ D2-2] [+ D2-3] [+ D2-6]      │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ ☐ D4-1 (Available)                 [▼] [🗑]│     │
│ │ Mã: [D4-1]  Tên: [D4-1 - 4 năm...]         │     │
│ │ Mô tả: [Input enabled]                       │     │
│ │                                            │     │
│ │ DANH SÁCH PHÍ                    [+ Thêm]  │     │
│ │ ┌──────────────────────────────────────┐   │     │
│ │ │ Học phí  [fixed ▼] [tuition ▼] [🗑]│   │     │
│ │ │ Giá: [52000000] [KRW ▼]  Bắt buộc: ☑│   │     │
│ │ └──────────────────────────────────────┘   │     │
│ └─────────────────────────────────────────────┘     │
│                                                     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 💰 Tổng: 95.200.000 KRW                    │     │
│ │ Hệ: D4-1, D2-2                             │     │
│ └─────────────────────────────────────────────┘     │
│                                        [Hủy] [Lưu]│
└─────────────────────────────────────────────────────┘
```

## Responsive
- Desktop: 3-col grid for systems
- Tablet: 2-col grid
- Mobile: Horizontal scroll for systems, stacked layout

## Interactions
- Button hover: 150ms ease
- Card hover: 200ms ease, shadow increase
- Accordion: 300ms ease-in-out
- Modal: 250ms fade + scale

## Output
1. Component library with all variants
2. Desktop frame (1440px) - Edit Modal
3. Mobile frame (375px) - Responsive layout
4. My Costs page with fixed system costs
5. Prototype showing:
   - Clicking system buttons adds systems
   - Toggle availability switches
   - Adding fees with prices
   - Real-time cost calculation
   - No more "0 đ" display!

## Key Fixes to Visualize
1. System costs showing actual values (52M KRW) not 0
2. No duplication between sections
3. Optional costs with visible prices
4. Edit modal with enabled input fields
5. Dynamic fee rows with dropdown options
6. Real-time sync indicator when data updates
