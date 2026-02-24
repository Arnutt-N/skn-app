# รายงาน: คู่มือครบวงจรการสร้าง Skill สำหรับ Claude
**ที่มา:** The Complete Guide to Building Skills for Claude (Anthropic)
**วันที่:** 2026-02-22
**ภาษา:** ภาษาไทย (สรุปหลักการสำคัญ)

---

## บทนำ — Skill คืออะไร?

**Skill** คือชุดคำสั่ง (instructions) ที่บรรจุไว้ในโฟลเดอร์เดียว ทำหน้าที่สอน Claude ให้รับมือกับงานหรือ workflow เฉพาะด้านได้

**ประโยชน์หลัก:**
- สอน Claude ครั้งเดียว ใช้ได้ทุกครั้ง — ไม่ต้องอธิบาย preference ซ้ำในทุก conversation
- เหมาะกับ workflow ที่ทำซ้ำบ่อย เช่น generate frontend design, research methodology, สร้าง document ตาม style guide
- ทำงานร่วมกับ MCP (Model Context Protocol) ได้ดีเยี่ยม

**2 เส้นทางใช้งาน:**
1. **Standalone Skills** — ไม่ต้องการ MCP
2. **MCP-Enhanced Skills** — เสริม workflow บน MCP server ที่มีอยู่แล้ว

---

## บทที่ 1 — Fundamentals (พื้นฐาน)

### โครงสร้างของ Skill

```
your-skill-name/
├── SKILL.md          # บังคับ — ไฟล์หลัก
├── scripts/          # ทางเลือก — โค้ดที่รันได้ (Python, Bash)
├── references/       # ทางเลือก — เอกสารอ้างอิง
└── assets/           # ทางเลือก — template, font, icon
```

### หลักการออกแบบหลัก 3 ข้อ

#### 1. Progressive Disclosure (เปิดเผยข้อมูลแบบค่อยเป็นค่อยไป)
ระบบ 3 ระดับเพื่อประหยัด token:

| ระดับ | ที่อยู่ | โหลดเมื่อไหร่ |
|-------|---------|--------------|
| 1 | YAML frontmatter | **โหลดเสมอ** — อยู่ใน system prompt ทุกครั้ง |
| 2 | SKILL.md body | โหลดเมื่อ Claude คิดว่า skill นี้เกี่ยวข้องกับ task |
| 3 | Linked files | โหลดเฉพาะเมื่อต้องการ — เอกสารอ้างอิงเพิ่มเติม |

#### 2. Composability (ประกอบร่วมกันได้)
Claude โหลด skill หลายตัวพร้อมกันได้ — skill ของคุณต้องทำงานร่วมกับ skill อื่นได้ ไม่สันนิษฐานว่าตัวเองเป็น skill เดียว

#### 3. Portability (ใช้งานข้ามแพลตฟอร์ม)
Skill เดียวกันทำงานได้บน Claude.ai, Claude Code, และ API — สร้างครั้งเดียว ใช้ได้ทุกที่

### Skill + MCP: อุปมาเรื่องครัว
- **MCP** = ครัวมืออาชีพ: เครื่องมือ, วัตถุดิบ, อุปกรณ์
- **Skill** = สูตรอาหาร: ขั้นตอนทีละขั้นเพื่อสร้างสิ่งมีคุณค่า

**ปัญหาเมื่อไม่มี Skills:**
- User เชื่อมต่อ MCP แล้วไม่รู้จะทำอะไรต่อ
- ทุก conversation เริ่มต้นจากศูนย์
- ผลลัพธ์ไม่สม่ำเสมอ

**ประโยชน์เมื่อมี Skills:**
- Workflow สำเร็จรูปทำงานอัตโนมัติ
- ผลลัพธ์สม่ำเสมอทุกครั้ง
- ลด learning curve

---

## บทที่ 2 — Planning and Design (การวางแผนและออกแบบ)

### เริ่มจาก Use Cases (กรณีการใช้งาน)

ก่อนเขียนอะไร ระบุ 2-3 use cases ที่ชัดเจน:

```
Use Case: [ชื่อ use case]
Trigger: User พูดว่า "..." หรือ "..."
Steps:
  1. [ขั้นตอนที่ 1]
  2. [ขั้นตอนที่ 2]
Result: [ผลลัพธ์ที่คาดหวัง]
```

**คำถามที่ต้องถามตัวเอง:**
- User ต้องการทำอะไร?
- Workflow หลายขั้นตอนต้องการอะไรบ้าง?
- เครื่องมือไหนที่ต้องการ (built-in หรือ MCP)?
- ความรู้เฉพาะทางหรือ best practices อะไรที่ควรฝังไว้?

### 3 หมวดหมู่ Use Case ที่พบบ่อย

#### Category 1: Document & Asset Creation
- **ใช้สำหรับ:** สร้าง output ที่มีคุณภาพสม่ำเสมอ (เอกสาร, presentation, โค้ด)
- **เทคนิค:** style guide ในตัว, template structures, quality checklist
- **ตัวอย่าง:** `frontend-design` skill

#### Category 2: Workflow Automation
- **ใช้สำหรับ:** กระบวนการหลายขั้นตอนที่ต้องการ methodology สม่ำเสมอ
- **เทคนิค:** step-by-step workflow, validation gates, iterative refinement
- **ตัวอย่าง:** `skill-creator` skill

#### Category 3: MCP Enhancement
- **ใช้สำหรับ:** เพิ่ม workflow guidance บน MCP server ที่มีอยู่
- **เทคนิค:** ประสาน MCP calls หลายตัว, ฝัง domain expertise
- **ตัวอย่าง:** `sentry-code-review` skill

### กำหนด Success Criteria (เกณฑ์ความสำเร็จ)

**ตัวชี้วัดเชิงปริมาณ:**
- Skill trigger บน 90% ของ query ที่เกี่ยวข้อง
- จบ workflow ภายใน X tool calls ที่กำหนด
- 0 failed API calls ต่อ workflow

**ตัวชี้วัดเชิงคุณภาพ:**
- User ไม่ต้องบอก Claude ว่าต้องทำอะไรต่อ
- Workflow สำเร็จโดยไม่ต้องผู้ใช้แก้ไข
- ผลลัพธ์สม่ำเสมอข้ามหลาย session

### Technical Requirements (ข้อกำหนดทางเทคนิค)

#### กฎสำคัญสำหรับไฟล์
- **ชื่อไฟล์:** ต้องเป็น `SKILL.md` เท่านั้น (case-sensitive)
- **ชื่อโฟลเดอร์:** ใช้ kebab-case เท่านั้น (`my-skill-name`)
- **ห้ามมี README.md** ในโฟลเดอร์ skill (ใส่ไว้ใน SKILL.md หรือ references/ แทน)

#### YAML Frontmatter — หัวใจของ Skill

```yaml
---
name: skill-name-in-kebab-case
description: ทำอะไร. ใช้เมื่อ user พูดว่า [specific phrases].
---
```

**Field ที่บังคับ:**

| Field | กฎ |
|-------|-----|
| `name` | kebab-case, ไม่มีช่องว่าง, ไม่มีตัวพิมพ์ใหญ่ |
| `description` | ต้องมีทั้ง WHAT และ WHEN, ไม่เกิน 1024 ตัวอักษร, ห้ามมี XML tags |

**รูปแบบ description ที่ดี:**
```
[สิ่งที่ skill ทำ] + [เมื่อไหร่ที่ควรใช้] + [ความสามารถหลัก]
```

**ตัวอย่างดี ✅:**
```yaml
description: วิเคราะห์ไฟล์ Figma และสร้างเอกสาร developer handoff.
  ใช้เมื่อ user อัปโหลดไฟล์ .fig หรือถามเรื่อง "design specs",
  "component documentation", หรือ "design-to-code handoff"
```

**ตัวอย่างแย่ ❌:**
```yaml
description: ช่วยเรื่องโปรเจกต์  # คลุมเครือเกินไป
description: สร้างระบบเอกสาร     # ไม่มี trigger phrase
```

**Field เสริม:**
```yaml
license: MIT
compatibility: "Requires Claude Code with FastAPI backend"
metadata:
  author: Team Name
  version: 1.0.0
  mcp-server: server-name
  category: productivity
```

**Security Restrictions:**
- ห้ามใช้ XML angle brackets (`< >`) ใน frontmatter
- ห้ามตั้งชื่อ skill ที่มี "claude" หรือ "anthropic"

### การเขียน Instructions ที่มีประสิทธิภาพ

**โครงสร้างแนะนำ:**
```markdown
---
name: your-skill
description: [...]
---

# Skill Name

## Instructions

### Step 1: [ขั้นตอนแรก]
คำอธิบายชัดเจน

### Step 2: [ขั้นตอนที่สอง]
...

## Examples

### Example 1: [scenario ทั่วไป]
User พูดว่า: "..."
Actions: ...
Result: ...

## Troubleshooting

### Error: [ข้อความ error ที่พบบ่อย]
Cause: [สาเหตุ]
Solution: [วิธีแก้]
```

**Best Practices:**
1. **ชัดเจนและ actionable** — ระบุคำสั่งที่ทำได้จริง ไม่ใช่แค่แนวทาง
2. **รวม error handling** — บอกวิธีจัดการปัญหาที่พบบ่อย
3. **อ้างอิง references ชัดเจน** — link ไปยังไฟล์ใน `references/`
4. **ใช้ Progressive Disclosure** — เนื้อหาหลักใน SKILL.md, รายละเอียดใน `references/`

---

## บทที่ 3 — Testing and Iteration (การทดสอบและปรับปรุง)

### 3 ระดับการทดสอบ

| ระดับ | วิธี | เหมาะกับ |
|-------|------|----------|
| Manual | ทดสอบใน Claude.ai ตรงๆ | iteration เร็ว, ไม่ต้อง setup |
| Scripted | Automate test cases ใน Claude Code | validation ที่ทำซ้ำได้ |
| Programmatic | สร้าง evaluation suite ผ่าน API | deployment scale ใหญ่ |

**Pro Tip:** iterate บน task เดียวก่อนจนสำเร็จ แล้วค่อยขยายเป็น test หลายตัว

### 3 พื้นที่การทดสอบ

#### 1. Triggering Tests (ทดสอบการ trigger)
- ✅ Skill trigger บน task ชัดเจน
- ✅ Skill trigger เมื่อ user พูดต่างรูปแบบ
- ❌ Skill ไม่ trigger สำหรับ topic ที่ไม่เกี่ยวข้อง

#### 2. Functional Tests (ทดสอบการทำงาน)
- Output ที่ถูกต้องถูกสร้างขึ้น
- API calls สำเร็จ
- Error handling ทำงาน
- Edge cases ครอบคลุม

#### 3. Performance Comparison (เปรียบเทียบประสิทธิภาพ)
| ตัวชี้วัด | ไม่มี Skill | มี Skill |
|-----------|------------|---------|
| Back-and-forth messages | 15 ครั้ง | 2 ครั้ง |
| Failed API calls | 3 ครั้ง | 0 ครั้ง |
| Tokens consumed | 12,000 | 6,000 |

### สัญญาณที่ต้องแก้ไข

**Undertriggering (trigger น้อยเกินไป):**
- Skill ไม่ load เมื่อควร → เพิ่ม keywords และ detail ใน description

**Overtriggering (trigger มากเกินไป):**
- Skill load สำหรับ query ที่ไม่เกี่ยวข้อง → เพิ่ม negative triggers

**Execution Issues (ปัญหาการทำงาน):**
- ผลลัพธ์ไม่สม่ำเสมอ → ปรับปรุง instructions, เพิ่ม error handling

---

## บทที่ 4 — Distribution and Sharing (การแจกจ่าย)

### วิธีแจกจ่าย Skill

**สำหรับผู้ใช้ทั่วไป:**
1. Download โฟลเดอร์ skill
2. Zip โฟลเดอร์
3. Upload ที่ Claude.ai → Settings → Capabilities → Skills
4. หรือวางในไดเรกทอรี skills ของ Claude Code

**สำหรับองค์กร:**
- Admin deploy skills ทั้ง workspace ได้ (ฟีเจอร์ใหม่ ธ.ค. 2025)
- Auto-update และ centralized management

**การใช้ผ่าน API:**
- Endpoint `/v1/skills` สำหรับจัดการ skills
- เพิ่ม skills ใน Messages API ผ่าน `container.skills`
- ใช้กับ Claude Agent SDK

### แนวทางปฏิบัติที่แนะนำ
1. Host บน GitHub (public repo, README ชัดเจน)
2. Document ใน MCP repo ของคุณพร้อม quick-start guide
3. สร้าง Installation Guide ที่ชัดเจน

---

## บทที่ 5 — Patterns and Troubleshooting

### 5 Patterns ที่พบบ่อย

#### Pattern 1: Sequential Workflow Orchestration
**ใช้เมื่อ:** ต้องการ multi-step process ในลำดับที่แน่นอน
- Explicit step ordering
- Dependencies ระหว่าง steps
- Validation ทุก stage

#### Pattern 2: Multi-MCP Coordination
**ใช้เมื่อ:** Workflow ครอบคลุมหลาย service
- แบ่ง phase ชัดเจน
- ส่งข้อมูลระหว่าง MCPs
- Centralized error handling

#### Pattern 3: Iterative Refinement
**ใช้เมื่อ:** คุณภาพ output ดีขึ้นด้วยการทำซ้ำ
- Explicit quality criteria
- Validation scripts
- รู้ว่าควรหยุด iterate เมื่อไหร่

#### Pattern 4: Context-Aware Tool Selection
**ใช้เมื่อ:** ผลลัพธ์เดียวกัน แต่เครื่องมือต่างกันตาม context
- Clear decision criteria
- Fallback options
- อธิบายให้ user รู้ว่าทำไมเลือกเครื่องมือนั้น

#### Pattern 5: Domain-Specific Intelligence
**ใช้เมื่อ:** Skill เพิ่ม domain knowledge เกินกว่าแค่ tool access
- Domain expertise ฝังอยู่ใน logic
- Compliance check ก่อนดำเนินการ
- Comprehensive audit trail

### Troubleshooting สำคัญ

| ปัญหา | สาเหตุ | วิธีแก้ |
|-------|--------|---------|
| Skill ไม่ upload | ไม่มีไฟล์ `SKILL.md` หรือ YAML ผิดรูปแบบ | ตรวจสอบชื่อไฟล์ และ delimiter `---` |
| Skill ไม่ trigger | Description คลุมเครือ ไม่มี trigger phrases | เพิ่ม keyword และ specific phrases |
| Skill trigger บ่อยเกิน | Description กว้างเกิน | เพิ่ม negative triggers, ระบุ scope |
| MCP connection ล้มเหลว | API key หมดอายุ, ชื่อ tool ผิด | ตรวจสอบ auth และ tool names |
| Instructions ไม่ถูกทำตาม | Instructions ยาวเกินไป, คลุมเครือ | ใช้ bullet points, วาง critical instructions ด้านบน |
| Context ใหญ่เกินไป | SKILL.md ยาวเกิน | ย้าย docs ไป `references/`, จำกัด 5,000 คำ |

---

## บทที่ 6 — Resources and References

### Quick Checklist ก่อน Upload

**ก่อนเริ่มต้น:**
- [ ] ระบุ 2-3 use cases ที่ชัดเจน
- [ ] ระบุ tools ที่ต้องการ

**ระหว่างพัฒนา:**
- [ ] ชื่อโฟลเดอร์ kebab-case
- [ ] มีไฟล์ `SKILL.md` (สะกดถูกต้อง)
- [ ] YAML frontmatter มี `---` delimiter
- [ ] `name` เป็น kebab-case
- [ ] `description` มีทั้ง WHAT และ WHEN
- [ ] ไม่มี XML tags
- [ ] Instructions ชัดเจนและ actionable
- [ ] มี error handling

**ก่อน upload:**
- [ ] ทดสอบ triggering บน obvious tasks
- [ ] ทดสอบ functional tests ผ่าน
- [ ] Compress เป็น `.zip`

**หลัง upload:**
- [ ] ทดสอบใน real conversations
- [ ] Monitor under/over-triggering
- [ ] Update version ใน metadata

---

## สรุปสำหรับโปรเจกต์ SKN App

Skills มีประโยชน์มากสำหรับ JskApp เพราะมี workflows ซ้ำหลายอย่าง:

| Skill ที่แนะนำ | หมวดหมู่ | ประโยชน์ |
|----------------|----------|---------|
| `line-webhook-debug` | Workflow Automation | debug webhook events |
| `live-chat-admin` | MCP Enhancement | จัดการ live chat session |
| `service-request-manager` | Workflow Automation | จัดการ service requests |
| `intent-configurator` | Document & Asset Creation | สร้าง chatbot intents |
| `flex-message-builder` | Document & Asset Creation | สร้าง LINE flex messages |
| `frontend-component` | Document & Asset Creation | สร้าง Next.js components ตาม design system |

---

*รายงานนี้สรุปจาก "The Complete Guide to Building Skills for Claude" โดย Anthropic*
