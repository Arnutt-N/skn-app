# Landing Page Redesign Plan — หน่วยงานราชการ

> Created: 2026-03-29 | Status: PENDING REVIEW
> Target file: `frontend/app/page.tsx`
> Design reference: หน่วยงานราชการไทย + ความทันสมัย (LINE Green + Brand Purple)

---

## Design Direction

### โทนสี
- **Brand (Purple)**: คงไว้เป็นสี primary ของระบบ (brand-500 ~ brand-700)
- **LINE Green** (`hsl(141 73% 42%)` ~ `#06C755`): ใช้สำหรับปุ่มที่เกี่ยวกับ LINE OA, LIFF form
- **ราชการ Trust**: โทน navy/slate สำหรับ header/footer ให้ดูน่าเชื่อถือ
- **Neutral warm**: พื้นหลัง warm gray (`gray-50`) ไม่ขาวจ้าเกินไป
- **สม่ำเสมอ**: ปุ่ม/โลโก้/ไอคอนใช้โทนเดียวกัน ไม่กระจายสีรุ้ง

### หลักการ
1. ดูเป็นทางการ น่าเชื่อถือ (ราชการ) แต่ไม่เชย
2. สีกลมกลืน: Purple (brand) + Green (LINE) + Navy (trust)
3. ข้อมูลชัดเจน อ่านง่าย ภาษาไทยรองรับดี
4. รองรับ dark mode + i18n toggle

---

## Components ที่ต้องเพิ่ม/แก้ไข

### 1. Hero Carousel (ส่วนปก — Jumbotron)

แทนที่ hero section ปัจจุบัน ด้วย carousel ที่เลื่อนภาพอัตโนมัติ:

```
┌──────────────────────────────────────────────────┐
│  [Navbar: Logo | Links | ThemeToggle | LangToggle | Login]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  SLIDE 1 (auto 5s)                        │  │
│  │  ภาพ: ระบบ LINE OA + ประชาชน             │  │
│  │  ──────────────────────                   │  │
│  │  Overlay text:                            │  │
│  │  "ระบบบริการประชาชน ผ่าน LINE Official"  │  │
│  │  [เข้าสู่ระบบ] [ส่งคำร้อง]               │  │
│  │                           ● ○ ○ (dots)    │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Height: 400-500px (ไม่สูงเกินไป)              │
│  Auto-slide: ทุก 5 วินาที                       │
│  Pause on hover                                  │
│  Swipe support (mobile)                          │
│                                                  │
├──────────────────────────────────────────────────┤
```

**Slides (3 ภาพ):**
1. ภาพ 1: ระบบ LINE OA — ข้อความ + ปุ่ม CTA
2. ภาพ 2: Live Chat & Service Request
3. ภาพ 3: Analytics Dashboard & Reports

**Implementation:**
- ใช้ CSS-only carousel (`scroll-snap-type`) หรือ lightweight lib
- ภาพใช้ placeholder gradient + overlay text (ยังไม่มีรูปจริง)
- Dots indicator ด้านล่าง
- Auto-play ทุก 5 วินาที, pause on hover

### 2. Navbar Update

```
┌──────────────────────────────────────────────────┐
│  [Logo: กยธ. JSK] | Features | Stats |          │
│                    [🌙/☀️ Theme] [TH/EN] [Login] │
└──────────────────────────────────────────────────┘
```

**เพิ่ม:**
- ปุ่มเปลี่ยน Theme (dark/light) — ใช้ `useTheme` ที่มีอยู่แล้ว
- ปุ่มเปลี่ยนภาษา TH/EN (toggle, เก็บ state ใน localStorage)
- ปรับโลโก้ให้มี text "กยธ." หรือชื่อหน่วยงานย่อ

### 3. LINE Section (สีเขียว)

ส่วนเน้น LINE Official Account + LIFF Form ใช้โทนเขียว LINE:

```
┌──────────────────────────────────────────────────┐
│  bg: LINE Green gradient                        │
│                                                  │
│  [LINE icon]  LINE Official Account             │
│  "เพิ่มเพื่อน LINE OA เพื่อรับบริการ"          │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 💬 แชท   │  │ 📋 คำร้อง │  │ 📊 ติดตาม │     │
│  │ กับเรา   │  │ บริการ   │  │ สถานะ    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  [เพิ่มเพื่อน LINE 🟢]  [แบบฟอร์ม LIFF 🟢]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Design tokens เพิ่ม:**
```css
--color-line-green: hsl(141 73% 42%);      /* #06C755 */
--color-line-green-dark: hsl(141 73% 35%);
--color-line-green-light: hsl(141 60% 90%);
```

**ปุ่ม LINE / LIFF:**
- ใช้ `bg-[--color-line-green]` + `text-white`
- Hover: `bg-[--color-line-green-dark]`
- Icon: LINE logo SVG หรือ MessageCircle

### 4. Features Grid (ปรับ)

คงโครงสร้างเดิม แต่:
- ปรับสีไอคอนให้กลมกลืนกว่า (ใช้ brand-600 ทุกตัว แทน 6 สีต่างกัน)
- หรือใช้ 2 โทน: brand (ฟีเจอร์ระบบ) + line-green (ฟีเจอร์ LINE)
- เพิ่ม border-left สี brand เพื่อเน้นความเป็นทางการ

### 5. Stats Section (ปรับ)

คงเดิม แต่เพิ่ม:
- Animated counter (นับขึ้นเมื่อ scroll เข้าพื้นที่)
- ไอคอนประกอบตัวเลข

### 6. Footer แบบมืออาชีพ

```
┌──────────────────────────────────────────────────┐
│  bg: navy/dark (gray-900)                        │
│                                                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │ เกี่ยวกับ │ │ บริการ    │ │ ลิงก์     │ │ ติดต่อ││
│  │ ระบบ JSK │ │ Live Chat│ │ กยธ.     │ │ email││
│  │ เกี่ยวกับ │ │ คำร้อง   │ │ กระทรวง  │ │ โทร  ││
│  │ กยธ.    │ │ Chatbot  │ │ ยุติธรรม  │ │ ที่อยู่ ││
│  │ นโยบาย  │ │ Reports  │ │ LINE OA  │ │      ││
│  └─────────┘ └──────────┘ └──────────┘ └──────┘│
│                                                  │
│  ─────────────────────────────────────────────── │
│  [Logo] JSK 4.0 Platform                        │
│  © 2026 กรมคุ้มครองสิทธิและเสรีภาพ              │
│  กระทรวงยุติธรรม                                 │
│                                                  │
│  [Facebook] [LINE] [Website]                     │
└──────────────────────────────────────────────────┘
```

**4 columns:**
1. เกี่ยวกับ: ข้อมูลระบบ, หน่วยงาน, นโยบาย
2. บริการ: ลิงก์ไปหน้า features ต่างๆ
3. ลิงก์ภายนอก: เว็บหน่วยงานแม่, กระทรวง
4. ติดต่อ: email, โทร, ที่อยู่

**Bottom bar:** โลโก้ + copyright + social icons

### 7. Theme Toggle (Dark/Light)

- ใช้ `useTheme` hook ที่มีอยู่แล้ว (`components/providers/ThemeProvider.tsx`)
- ปุ่มใน Navbar: Sun/Moon icon toggle
- Landing page ต้อง wrap ด้วย ThemeProvider (ตรวจสอบว่า root layout มีอยู่แล้ว)

### 8. Language Toggle (TH/EN)

- สร้าง `LanguageProvider` ใหม่ (context + localStorage)
- ปุ่มใน Navbar: "TH" / "EN" toggle
- เก็บ translations ในไฟล์แยก `lib/i18n/landing.ts`
- **Scope**: แค่ landing page ก่อน (ไม่ต้องทำ i18n ทั้ง app)

```typescript
// lib/i18n/landing.ts
export const translations = {
  th: {
    hero_title: 'ระบบจัดการ LINE Official Account',
    hero_subtitle: 'แพลตฟอร์มครบวงจรสำหรับงานยุติธรรมชุมชน',
    login: 'เข้าสู่ระบบ',
    liff_form: 'แบบฟอร์ม LIFF',
    features: 'ฟีเจอร์',
    // ...
  },
  en: {
    hero_title: 'LINE Official Account Management',
    hero_subtitle: 'All-in-one Platform for Community Justice Services',
    login: 'Login',
    liff_form: 'LIFF Form',
    features: 'Features',
    // ...
  },
};
```

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `frontend/app/page.tsx` | Rewrite | Landing page ทั้งหน้า |
| `frontend/app/globals.css` | Modify | เพิ่ม LINE Green tokens |
| `frontend/app/layout.tsx` | Modify | ตรวจสอบ ThemeProvider wrap |
| `frontend/lib/i18n/landing.ts` | Create | Landing page translations TH/EN |
| `frontend/components/landing/HeroCarousel.tsx` | Create | Auto-sliding carousel |
| `frontend/components/landing/LINESection.tsx` | Create | LINE OA section (green) |
| `frontend/components/landing/Footer.tsx` | Create | Professional 4-column footer |
| `frontend/components/landing/LanguageToggle.tsx` | Create | TH/EN toggle button |

---

## Color Palette Summary

| Element | สี | Token |
|---------|-----|-------|
| Brand/Primary | Purple | `brand-500` ~ `brand-700` |
| LINE buttons | Green | `--color-line-green` (new) |
| LIFF form buttons | Green | `--color-line-green` (new) |
| Navbar/Footer | Dark Navy | `gray-900` / `sidebar-bg` |
| Background | Warm Gray | `bg` / `gray-50` |
| Trust accents | Navy Blue | `info-dark` |
| Feature icons | Unified brand | `brand-600` (ทุกตัว) หรือ 2-tone |
| Text | Standard | `text-primary`, `text-secondary` |
| Dark mode | Auto | ผ่าน design tokens ที่มีอยู่ |

---

## Risks and Notes

| Risk | Mitigation |
|------|------------|
| Carousel performance on mobile | ใช้ CSS scroll-snap (no JS lib), lazy load images |
| i18n complexity | Scope แค่ landing page, ไม่ทำ admin/LIFF |
| ภาพ carousel ยังไม่มี | ใช้ gradient placeholder + overlay text ก่อน |
| Dark mode consistency | ตรวจสอบ LINE green contrast บน dark bg |
| Footer links broken | ใช้ `#` placeholder สำหรับ external links |

---

## Implementation Order

```
1. เพิ่ม LINE Green tokens ใน globals.css
2. สร้าง i18n translations file
3. สร้าง HeroCarousel component
4. สร้าง LINESection component
5. สร้าง Footer component
6. สร้าง LanguageToggle component
7. Rewrite page.tsx — ประกอบทุก component + Theme toggle
8. ทดสอบ dark mode + language toggle
```

---

## SESSION_ID

- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
