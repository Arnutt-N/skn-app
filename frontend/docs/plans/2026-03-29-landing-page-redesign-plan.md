# Landing Page Redesign Plan

**Date:** 2026-03-29  
**Scope:** Public landing page refresh for `frontend/app/page.tsx` and related landing components  
**Direction:** Modern, professional, more formal, and visually consistent across brand/color/logo/navigation/footer

---

## Goal

ยกระดับ landing page ให้ดูร่วมสมัยและเป็นทางการมากขึ้น โดยใช้ visual language เดียวกันทั้งหน้า ไม่ให้แต่ละ section ดูคนละระบบกัน และรักษา `LINE Official Account` / ปุ่มที่เกี่ยวกับ LINE ไว้เป็น accent สีเขียวตามแบรนด์ LINE เท่านั้น

เป้าหมายหลักของรอบ implement:

1. ทำให้ภาพรวมหน้าแรกดูเป็นระบบเดียวกันมากขึ้น
2. ลดความรู้สึก “หลายธีมปะปนกัน” ระหว่างม่วง น้ำเงิน และเขียว
3. ปรับ copy / button label ให้เป็นภาษาที่ผู้ใช้เข้าใจทันที
4. แก้ปัญหาข้อความตกบรรทัดโดยไม่จำเป็นบน desktop
5. ปรับ navbar และ footer ให้ดูเป็น public-facing product ที่น่าเชื่อถือ

---

## Current Findings

จากโค้ดปัจจุบันพบประเด็นหลักดังนี้:

1. หน้าแรกยังแยก visual hierarchy ออกเป็นหลายบล็อก (`HeroCarousel` + `LandingHero` + stats + card grid + LINE section) ทำให้ first impression ไม่คมพอ
2. ระบบสีหลักยังไม่สอดคล้องกัน:
   - `brand-*` ใน `globals.css` ยังเป็นโทนม่วง
   - logo ใน navbar เป็นน้ำเงิน
   - section LINE ใช้เขียวเต็มบล็อก
   - footer ใช้ raw `gray-*`
3. branding ยังไม่คงที่:
   - มีทั้ง `JskApp`, `JSK Platform`, `JSK 4.0 Platform`, `JS`
4. copy บางปุ่มและ section ยังเป็นภาษาภายในระบบ เช่น `แบบฟอร์ม LIFF`
5. LINE section แยกตัวออกจากธีมหลักมากเกินไป เพราะใช้พื้นหลังเขียวเต็ม section
6. desktop typography ยังมีโอกาส wrap เกินจำเป็นจาก:
   - การบังคับ `<br />` ใน hero
   - ความกว้าง text container ที่แคบเกินไปบางจุด
   - การไม่ได้ใช้ no-wrap/balanced wrapping แบบเจาะจงกับข้อความสั้น
7. landing page ยังใช้ card-heavy layout หลายจุด ซึ่งขัดกับ direction ที่ดูทางการและ premium มากขึ้น
8. ยังไม่พบไฟล์ logo/image asset จริงใน `frontend` จึงควรวางแผน brand mark แบบ reusable component หรือเตรียมรับ SVG ภายหลัง

---

## Frontend Skill Direction

### Visual Thesis

หน้าแรกควรให้ความรู้สึกเป็น “government service platform ที่ทันสมัย สุขุม และเชื่อถือได้” โดยใช้โทนหลักเรียบ สงบ หนักแน่น และให้สีเขียวของ LINE ปรากฏเฉพาะจุดที่เกี่ยวกับ LINE จริง ๆ

### Content Plan

1. Hero: ชื่อระบบ + คุณค่าหลัก + CTA หลัก + visual anchor เดียว
2. Support: capability summary แบบไม่ใช้ card mosaic
3. Detail: LINE access / service request / tracking ในโทนเดียวกับหน้า
4. Final CTA: เข้าสู่ระบบ หรือส่งคำขอรับบริการ

### Interaction Thesis

1. Navbar มี motion เบา ๆ แบบ refined sticky header
2. Hero และ section หลัก reveal แบบสั้น กระชับ ไม่ flashy
3. CTA / link hover ใช้ motion เดียวกันทั้งหน้าเพื่อให้รู้สึกเป็นระบบเดียว

---

## Design Direction

### 1. Brand System

กำหนด visual system ใหม่สำหรับหน้า landing:

- Base theme: deep navy / slate / warm neutral background
- Accent หลักของระบบ: ใช้เฉดเข้มของ theme เดียวกัน ไม่ใช้ม่วงสด
- LINE accent: ใช้เฉพาะคำว่า `LINE Official Account`, ปุ่ม LINE, badge หรือ micro highlight ที่เกี่ยวกับ LINE โดยตรง
- Logo/brand mark: ใช้รูปแบบเดียวกันทั้ง navbar และ footer

ข้อเสนอแนะ:

- หากยังไม่มีโลโก้จริง ให้ใช้ wordmark + monogram ที่นิ่งและทางการกว่าของเดิม
- ถ้ามีไฟล์ SVG โลโก้จริงภายหลัง สามารถแทน reusable brand mark component ได้ทันที

### 2. Typography

- รักษา `Noto Sans Thai` เป็น font หลัก
- ลดการใช้ heading ที่ดู marketing เกินไป
- ปรับ headline ให้คม สั้น และอ่านจบได้เร็ว
- ใช้ `thai-no-break` / `whitespace-nowrap` / balanced text อย่างเจาะจงกับข้อความสั้น
- เลิกบังคับ `<br />` ใน hero แบบคงที่ แล้วเปลี่ยนเป็น responsive line control

### 3. Layout Strategy

- ลดความซ้ำซ้อนของ first screen
- แนะนำให้ “ยุบ” หรือ “ถอด” `HeroCarousel` ออกจากด้านบน แล้วให้ hero กลายเป็น first impression หลักเพียงชิ้นเดียว
- ลด card grid ใน feature section ให้เป็น structured content block หรือ split layout ที่สะอาดกว่า
- ทำให้ spacing, border radius, shadows, and section rhythm สม่ำเสมอทั้งหน้า

---

## Proposed Information Architecture

### Section 1: Navbar

ปรับใหม่ให้ดูเป็น public-facing header ที่เป็นทางการขึ้น:

- ใช้ brand mark เดียว
- ลด visual noise ฝั่งขวา
- จัดลำดับ action ใหม่: language, login, dashboard/request CTA
- ทำ spacing ให้สมดุลกว่าเดิม
- พิจารณาลดบทบาท theme toggle ถ้าต้องการภาพลักษณ์ public/government ที่นิ่งขึ้น

### Section 2: Hero

ปรับ `LandingHero` ให้เป็น hero หลักของหน้า:

- full-bleed หรือ near full-bleed visual plane
- หัวเรื่องสั้นขึ้นและคุม line-length ใหม่
- ให้คำว่า `LINE Official Account` เป็นสีเขียวเฉพาะคำ ไม่ใช่ทั้ง section
- CTA หลักสองปุ่ม:
  - `เข้าสู่ระบบ Admin`
  - `คำขอรับบริการ` หรือ `ส่งคำขอรับบริการ`
- ยกเลิก label `แบบฟอร์ม LIFF`

### Section 3: Support / Capability Summary

แทน feature card grid เดิมด้วย section ที่อ่านเร็วและดูทางการกว่า:

- ใช้ 3-4 capability columns หรือ split rows
- เน้นข้อความสั้นและ scanning ง่าย
- ลดพื้นหลังและกรอบที่ไม่จำเป็น

### Section 4: LINE Section

ปรับ `LandingLineSection` ใหม่ตาม requirement:

- เปลี่ยนพื้นหลังจากเขียวเต็ม section เป็นพื้นหลังในโทนเดียวกับ theme หลัก
- ใช้เขียวเฉพาะ:
  - คำว่า `LINE Official Account`
  - ปุ่ม Add Friend
  - ปุ่ม `คำขอรับบริการ`
  - badge / icon highlight ที่เกี่ยวกับ LINE
- คงสถานะ section นี้ไว้เป็น area สำหรับ user journey ผ่าน LINE แต่ไม่ให้กลายเป็นคนละธีมกับทั้งหน้า

### Section 5: Final CTA

- ใช้ภาษาที่ชัดกว่าเดิม
- รักษา button hierarchy ให้ตรงกับทั้งหน้า
- ไม่ให้ CTA block ดูซ้ำกับ hero มากเกินไป

### Section 6: Footer

ปรับ `LandingFooter` ใหม่ตาม best practices:

- ใช้ brand mark เดียวกับ navbar
- เปลี่ยน palette ให้เข้ากับธีมหลัก ไม่ใช้ raw gray แบบหลุดระบบ
- จัด column ให้ชัด: เกี่ยวกับระบบ / บริการ / ลิงก์ / ติดต่อ
- ปรับ typography, spacing, divider, bottom bar ให้เรียบร้อยขึ้น
- ตรวจสอบข้อความ contact/address และ encoding ตอน implement

---

## Text Wrapping Plan

ปัญหาที่ผู้ใช้แจ้งเรื่องข้อความตกบรรทัดจะจัดการโดยตรงในรอบ implement:

1. เอา hard-coded line break ใน hero ออก หรือเปลี่ยนเป็น responsive behavior
2. เพิ่ม utility สำหรับ short-heading / button label ที่ไม่ควร wrap บน desktop
3. ปรับ `max-width` ของ headline และ supporting text ให้เหมาะกับ desktop จริง
4. ใช้ `thai-no-break` กับ label/button/heading ที่สั้นและควรอ่านต่อเนื่อง
5. ตรวจเช็กจุดสำคัญต่อไปนี้เป็นพิเศษ:
   - hero headline
   - `LINE Official Account`
   - CTA buttons
   - section headings
   - navbar brand text

---

## Copy Changes

copy ที่ควรแก้แน่นอน:

- `แบบฟอร์ม LIFF` → `คำขอรับบริการ`
- `LIFF Form` → `Service Request`

copy ที่ควร review เพิ่ม:

- hero subtitle / description ให้กระชับขึ้น
- LINE section subtitle ให้เป็นภาษาผู้ใช้ ไม่เป็นภาษาระบบ
- footer labels ให้สอดคล้องกับ brand naming ที่เลือกใช้จริง

หมายเหตุ:

- ควรเลือก public-facing brand name ให้เหลือชื่อเดียวตลอดทั้งหน้า
- แนะนำให้ lock ชื่อเดียวระหว่าง `JskApp`, `JSK Platform`, และ `JSK 4.0 Platform`

---

## Files Planned For Update

### Core page composition

- `frontend/app/page.tsx`

### Landing components

- `frontend/components/landing/LandingNavbar.tsx`
- `frontend/components/landing/LandingHero.tsx`
- `frontend/components/landing/LandingLineSection.tsx`
- `frontend/components/landing/LandingFooter.tsx`
- `frontend/components/landing/LandingLanguageToggle.tsx`
- `frontend/components/landing/HeroCarousel.tsx`

### Content and tokens

- `frontend/lib/i18n/landing.ts`
- `frontend/app/globals.css`

### Optional follow-up

- `frontend/app/layout.tsx`
  - update metadata/title/description if public brand name changes

---

## Recommended Implementation Order

1. Freeze brand direction for landing:
   - primary palette
   - canonical public brand name
   - shared brand mark
2. Rebuild navbar + hero as one coherent first impression
3. Replace or simplify current carousel/feature composition
4. Redesign LINE section to stay on-theme with green accents only
5. Rebuild footer with the same design language
6. Update i18n copy and button labels
7. Run desktop/mobile wrap checks and spacing polish

---

## Success Criteria

- หน้า landing ดูเป็นระบบเดียวกันทั้งหน้า
- ไม่มี section ไหนดูเหมือนหลุดมาจากคนละ brand
- `LINE Official Account` ยังคงเด่นด้วยสีเขียว แต่ไม่ทำให้ทั้งหน้าเสียสมดุล
- ปุ่ม `คำขอรับบริการ` ใช้สีเขียวเหมือนเดิมและสื่อสารตรงกว่าเดิม
- desktop text wrapping ลดลงอย่างชัดเจนใน heading / labels / buttons
- navbar และ footer ดูทางการ อ่านง่าย และสอดคล้องกัน
- brand naming เหลือรูปแบบเดียวทั้งหน้า

---

## Recommendations

ข้อเสนอแนะเพิ่มเติมก่อนเริ่ม implement:

1. ถ้ามีโลโก้จริงของระบบหรือหน่วยงาน ควรส่งเป็น SVG เพื่อยกระดับความน่าเชื่อถือทันที
2. ถ้ามี URL เพิ่มเพื่อน LINE จริง ควรแทน `#` ใน LINE CTA ระหว่างรอบ implement
3. ถ้ามีหน้า privacy policy / contact จริง ควรผูก footer link ให้ครบ
4. ถ้าต้องการโทน “ทางการมาก” อย่างชัดเจน อาจพิจารณาตัด dark-mode toggle ออกจาก landing page
5. หากต้องการให้ hero มีน้ำหนักมากขึ้นในเชิงภาพ สามารถเพิ่ม official photo / contextual image ในรอบถัดไปได้ แต่รอบแรกยังทำให้ดีขึ้นได้ด้วย layout + typography + token cleanup

---

## Next Step

หลังจาก approve แผนนี้แล้ว ค่อยเริ่ม implement ตามลำดับ:

1. token + brand direction
2. navbar + hero
3. LINE section
4. footer
5. copy and wrap polish
