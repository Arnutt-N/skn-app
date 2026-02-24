# LIFF Form — Reference

Sources: `frontend/app/liff/service-request/page.tsx`,
`frontend/app/liff/layout.tsx`, `frontend/types/location.ts`

---

## File Locations

| File | Purpose |
|---|---|
| `frontend/app/liff/service-request/page.tsx` | Main 4-step wizard (single-file) |
| `frontend/app/liff/layout.tsx` | Loads LIFF SDK script |
| `frontend/types/location.ts` | Province, District, SubDistrict TypeScript types |
| `frontend/.env.local` | `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_API_URL` |

---

## Environment Variables

| Variable | Required | Value |
|---|---|---|
| `NEXT_PUBLIC_LIFF_ID` | Yes | LINE LIFF channel ID, e.g. `1234567890-AbCdEfGh` |
| `NEXT_PUBLIC_API_URL` | No | API base (default: `/api/v1`), used for province fetch only |

---

## TypeScript Location Types (`types/location.ts`)

```ts
interface Province {
  PROVINCE_ID: number
  PROVINCE_THAI: string
  PROVINCE_ENGLISH: string
}

interface District {
  DISTRICT_ID: number
  PROVINCE_ID: number
  DISTRICT_THAI: string
  DISTRICT_ENGLISH: string
}

interface SubDistrict {
  SUB_DISTRICT_ID: number
  DISTRICT_ID: number
  SUB_DISTRICT_THAI: string
  SUB_DISTRICT_ENGLISH: string
  POSTAL_CODE: string
}
```

---

## Form State

```ts
// Form data — all values sent to backend
formData = {
  prefix:           string    // required (step 0)
  firstname:        string    // required (step 0)
  lastname:         string    // required (step 0)
  phone_number:     string    // required (step 0), min 9 chars
  email:            string    // optional (step 0)
  agency:           string    // required (step 1)
  province:         string    // Thai name, e.g. "สกลนคร" (step 1)
  district:         string    // Thai name, e.g. "เมืองสกลนคร" (step 1)
  sub_district:     string    // Thai name, e.g. "ธาตุเชิงชุม" (step 1)
  topic_category:   string    // required (step 2)
  topic_subcategory:string    // required (step 2)
  description:      string    // required (step 2), textarea
  attachments:      Array<{   // optional (step 3)
    id:  string                 // UUID from POST /media
    url: string                 // /api/v1/media/{uuid} (display only)
    name: string                // original filename (display only)
  }>
}

// Logic state — NOT sent to backend
selectedProvinceId:  number | null  // integer ID for API cascade
selectedDistrictId:  number | null  // integer ID for API cascade
profile:             { userId: string } | null  // from liff.getProfile()
isInLineApp:         boolean  // liff.isInClient()
```

---

## Steps

| Index | Title (Thai) | Required Fields | Validation |
|---|---|---|---|
| 0 | ข้อมูลส่วนตัว | prefix, firstname, lastname, phone_number | phone_number ≥ 9 chars |
| 1 | หน่วยงาน | agency, province (via selectedProvinceId), district (via selectedDistrictId), sub_district | all four required |
| 2 | รายละเอียด | topic_category, topic_subcategory, description | subcategory from TOPIC_OPTIONS[category] |
| 3 | เอกสารแนบ | — (none required) | always passes |

---

## TOPIC_OPTIONS (Hardcoded)

```ts
const TOPIC_OPTIONS: Record<string, string[]> = {
  "กองทุนยุติธรรม": [
    "ค่าจ้างทนายความ",
    "ค่าธรรมเนียมศาล",
    "เงินประกันตัว",
    "อื่นๆ"
  ],
  "เงินเยียวยาเหยื่ออาชญากรรม": [
    "กรณีถูกทำร้ายร่างกาย/ถูกลูกหลง",
    "กรณีอุบัติเหตุจราจร",
    "กรณีอนาจาร/ข่มขืน",
    "กรณีจำเลยในคดีอาญาที่ศาลยกฟ้อง",
    "อื่นๆ"
  ],
  "ไกล่เกลี่ยข้อพิพาท": [
    "ข้อพิพาททางแพ่ง (ที่ดิน มรดก ครอบครัว หนี้ ค้ำประกัน เช่าชื้อ)",
    "ข้อพิพาททางอาญา (เพศ ร่างกาย ทรัพย์ รถชน)",
    "อื่นๆ"
  ],
  "ร้องเรียน/ร้องทุกข์": [
    "อธิบายสั้นๆ"
  ]
}
```

---

## Submit Payload

```ts
// POST /api/v1/liff/service-requests
{
  prefix:           "นาย",
  firstname:        "สมชาย",
  lastname:         "วงศ์ใหญ่",
  phone_number:     "0812345678",
  email:            "",
  agency:           "ศูนย์ยุติธรรมชุมชน",
  province:         "สกลนคร",
  district:         "เมืองสกลนคร",
  sub_district:     "ธาตุเชิงชุม",
  topic_category:   "กองทุนยุติธรรม",
  topic_subcategory:"ค่าจ้างทนายความ",
  description:      "ต้องการขอค่าจ้างทนายความ...",
  attachments:      [
    { id: "abc-uuid", url: "/api/v1/media/abc-uuid", name: "evidence.jpg" }
  ],
  line_user_id:     "Uxxxxxx" | null
}
```

---

## API Calls Made by the Form

| When | Method | URL | Purpose |
|---|---|---|---|
| Mount | `GET` | `${NEXT_PUBLIC_API_URL}/locations/provinces` | Load province list |
| Province selected | `GET` | `/api/v1/locations/provinces/{id}/districts` | Load district list |
| District selected | `GET` | `/api/v1/locations/districts/{id}/sub-districts` | Load sub-district list |
| File selected | `POST` | `/api/v1/media` (multipart) | Upload attachment |
| Form confirmed | `POST` | `/api/v1/liff/service-requests` | Submit form |

---

## LIFF SDK API Usage

```ts
import liff from '@line/liff'

await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID })

liff.isInClient()   // boolean — true when running inside LINE app
liff.isLoggedIn()   // boolean — true when user has LINE session
liff.login()        // redirect to LINE login (no return value)
liff.closeWindow()  // close LIFF window (only works inside LINE app)

const profile = await liff.getProfile()
// { userId, displayName, pictureUrl, statusMessage }
// Only userId is used in SKN App
```

---

## Agency Options (Hardcoded in `<select>`)

```
ศูนย์ยุติธรรมชุมชน
ศูนย์ดำรงธรรม
สถานีตำรวจภูธร
```

---

## Success State Behavior

```
success = true
├── isInLineApp = true
│   → Show countdown (5→0)
│   → setTimeout calls liff.closeWindow() at 0
│   → "ปิดหน้าต่างอัตโนมัติใน X วินาที" + manual close button
│
└── isInLineApp = false
    → Show "พิมพ์ 'ติดตาม' ใน LINE OA" instruction
    → "ท่านสามารถปิดหน้านี้ได้ทันที"
    → window.close() on button click (may silently fail)
```

---

## Known Gaps

| ID | Gap | Severity | Fix |
|---|---|---|---|
| GAP-1 | `TOPIC_OPTIONS` is hardcoded — adding categories requires code change | Medium | Move to admin-configurable SystemSetting or DB table |
| GAP-2 | Agency options are hardcoded in `<select>` — not configurable | Medium | Fetch from `/admin/settings` or dedicated endpoint |
| GAP-3 | Districts/sub-districts use hardcoded `/api/v1/` not `NEXT_PUBLIC_API_URL` | Low | Use env var consistently |
| GAP-4 | Sub-district reverse lookup by Thai name — fails if duplicate names | Low | Store SUB_DISTRICT_ID in formData |
| GAP-5 | No max file count or total size limit on attachments | Low | Add guard: e.g., max 5 files, 5MB each |
| GAP-6 | `profile?.userId` only — display_name not captured for LINE users | Low | Store `profile.displayName` too |
