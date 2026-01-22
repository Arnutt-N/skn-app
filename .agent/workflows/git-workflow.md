---
description: Enterprise Git Workflow - Complete commands with security checks and auto-logging
---

# 🔐 Enterprise Git Workflow

## Purpose
คำสั่ง Git ครบถ้วนพร้อมระบบตรวจสอบความปลอดภัยระดับ Enterprise ก่อน Push
รวมถึงบันทึก Git Log เป็น `.md` อัตโนมัติหลัง Push เสร็จ

---

## 📋 Quick Reference - Git Commands

### Basic Commands
| Command | Description |
|---------|-------------|
| `git status` | ดูสถานะไฟล์ที่เปลี่ยนแปลง |
| `git add .` | Stage ทุกไฟล์ที่แก้ไข |
| `git add <file>` | Stage เฉพาะไฟล์ที่ระบุ |
| `git commit -m "msg"` | Commit พร้อม message |
| `git push` | Push ไปยัง remote |
| `git pull` | Pull จาก remote |
| `git fetch` | Fetch updates จาก remote |

### Branch & Merge
| Command | Description |
|---------|-------------|
| `git branch` | ดู local branches |
| `git branch -a` | ดูทุก branches (local + remote) |
| `git checkout <branch>` | สลับ branch |
| `git checkout -b <new-branch>` | สร้างและสลับไป branch ใหม่ |
| `git merge <branch>` | Merge branch เข้ามา |
| `git cherry-pick <hash>` | เอา commit เดียวมาใช้ |
| `git branch -d <branch>` | ลบ local branch |

### Stash (บันทึกชั่วคราว)
| Command | Description |
|---------|-------------|
| `git stash` | เก็บการแก้ไขชั่วคราว |
| `git stash list` | ดูรายการ stash |
| `git stash pop` | นำ stash ล่าสุดกลับมาใช้ |
| `git stash apply` | ใช้ stash แต่ไม่ลบ |
| `git stash drop` | ลบ stash ล่าสุด |

### Tag (Versioning)
| Command | Description |
|---------|-------------|
| `git tag` | ดูรายการ tags ทั้งหมด |
| `git tag v1.0.0` | สร้าง lightweight tag |
| `git tag -a v1.0.0 -m "msg"` | สร้าง annotated tag |
| `git push origin v1.0.0` | Push tag เดียวไป remote |
| `git push origin --tags` | Push ทุก tags ไป remote |

### History
| Command | Description |
|---------|-------------|
| `git log -n 5` | ดู 5 commits ล่าสุด |
| `git log --oneline -n 10` | ดู 10 commits แบบสั้น |
| `git log --graph --oneline` | ดู history แบบ graph |
| `git diff` | ดูความแตกต่างที่ยังไม่ stage |
| `git diff --staged` | ดูความแตกต่างที่ staged แล้ว |

---

## 🎯 Commit Message Convention

### Format: `<type>(<scope>): <description>`

| Type | Description | Type | Description |
|------|-------------|------|-------------|
| `feat` | ฟีเจอร์ใหม่ | `perf` | ปรับปรุง performance |
| `fix` | แก้ bug | `test` | เพิ่ม/แก้ไข tests |
| `docs` | เปลี่ยนแปลงเอกสาร | `chore` | งานอื่นๆ (build, config) |
| `style` | Format code | `ci` | เปลี่ยนแปลง CI/CD |
| `refactor` | Refactor code | `security` | แก้ไขปัญหาความปลอดภัย |

**Examples:**
```bash
git commit -m "feat(auth): add LINE Login integration"
git commit -m "fix(api): resolve null pointer in request handler"
git commit -m "security(deps): update vulnerable packages"
```

---

## 🏷️ Semantic Versioning: `vMAJOR.MINOR.PATCH`

| Part | When to increment | Example |
|------|-------------------|---------|
| MAJOR | Breaking changes | v2.0.0 |
| MINOR | New features (backward compatible) | v1.1.0 |
| PATCH | Bug fixes (backward compatible) | v1.0.1 |

```bash
git tag -a v1.0.0 -m "Initial stable release"
git tag -a v1.1.0 -m "Add request management feature"
git tag -a v2.0.0 -m "BREAKING: Refactor API structure"
```

---

## 🔒 Pre-Push Security Checks (Enterprise Level)

### Step 1: Check Git Status
// turbo
```bash
cd /d "D:\genAI\skn-app" && git status
```

### Step 2: Security Scan - Sensitive Files (Enhanced)
// turbo
```bash
cd /d "D:\genAI\skn-app" && git diff --staged --name-only | findstr /I ".env .env. .pem .key .p12 .pfx id_rsa password secret token credential credentials database.yml config.ini"
```

### Step 3: Hardcoded Secrets Check (New)
// turbo
```bash
cd /d "D:\genAI\skn-app" && git diff --staged | findstr /I "password= api_key= secret= token= access_token= private_key= aws_secret"
```
> ⚠️ ถ้าพบ output = มี hardcoded secrets! ต้องแก้ไขก่อน push

### Step 4: Large Files Check (>5MB - Improved)
// turbo
```bash
cd /d "D:\genAI\skn-app" && git diff --staged --stat | findstr /R "[5-9][0-9][0-9][0-9][0-9][0-9][0-9]"
```

### Step 5: Verify .gitignore Working
// turbo
```bash
cd /d "D:\genAI\skn-app" && git check-ignore -v secrets/* examples/* .env .env.local 2>nul
```

### Step 6: Review Staged Files
// turbo
```bash
cd /d "D:\genAI\skn-app" && git diff --staged --name-status
```

---

## 📝 Complete Push Workflow

### Step 1: Check Current Branch
// turbo
```bash
cd /d "D:\genAI\skn-app" && git branch --show-current
```

### Step 2: Pull Latest Changes
// turbo
```bash
cd /d "D:\genAI\skn-app" && git pull origin main
```
> ⚠️ ตรวจสอบ conflicts ถ้ามี

### Step 3: Stage Changes
```bash
cd /d "D:\genAI\skn-app" && git add .
```
> 💡 หรือใช้ `git add <file>` สำหรับไฟล์เฉพาะ

### Step 4: Commit with Message
```bash
cd /d "D:\genAI\skn-app" && git commit -m "type(scope): description"
```

### Step 5: Create Tag (Optional)
```bash
cd /d "D:\genAI\skn-app" && git tag -a v1.x.x -m "Version description"
```

### Step 6: Push Changes
```bash
cd /d "D:\genAI\skn-app" && git push origin main
```

### Step 7: Push Tags (if created)
```bash
cd /d "D:\genAI\skn-app" && git push origin --tags
```

---

## 📊 Post-Push: Save Git Log as Markdown

### Step 8: Generate & Display Log
// turbo
```bash
cd /d "D:\genAI\skn-app" && git log -1 --pretty=format:"Hash: %%h%%nAuthor: %%an <%%ae>%%nDate: %%ci%%nMessage: %%s" && echo. && git diff HEAD~1 --name-status
```

### Step 9: Create Log File with Timestamp (New - Auto-Creates File)
// turbo
```bash
cd /d "D:\genAI\skn-app" && for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%b%%a && for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set mytime=%%a%%b && (echo # Git Log: %date% %time% && echo. && echo ## Latest Commit && git log -1 --pretty=format:"- Hash: %%h%%n- Author: %%an <%%ae>%%n- Date: %%ci%%n- Message: %%s" && echo. && echo. && echo ## Files Changed && git diff HEAD~1 --name-status && echo. && echo ## Security: All checks passed) > "project-log-md\git-log-%mydate%-%mytime%.md"
```

### Step 10: Verify Log File Created
// turbo
```bash
dir "D:\genAI\skn-app\project-log-md\git-log*.md" /B /O:-D
```

---

## ⚠️ Manual Commands (If Auto-Run Fails)

### Quick Check & Push
```bash
cd /d "D:\genAI\skn-app"
git status
git add .
git commit -m "your message"
git push origin main
```

### Security Manual Check
```bash
cd /d "D:\genAI\skn-app"
git diff --staged --name-only
git diff --staged | findstr /I "password= secret= token="
git check-ignore -v secrets/* .env
```

### View & Create Log
```bash
cd /d "D:\genAI\skn-app"
git log -3 --oneline
git log -1 --stat
```

---

## 🛡️ Security Checklist (Before Push)

- [ ] ไม่มีไฟล์ `.env`, `.env.*` ใน staged files
- [ ] ไม่มีไฟล์ใน `secrets/`, `examples/` ถูก stage
- [ ] ไม่มี API keys, tokens, passwords ใน code
- [ ] ไม่มี certificates (`.pem`, `.p12`, `.pfx`, `id_rsa`)
- [ ] ไม่มีไฟล์ขนาดใหญ่เกิน 5MB
- [ ] `.gitignore` ถูกอัพเดทครอบคลุม
- [ ] Pull latest changes สำเร็จ (ไม่มี conflicts)
- [ ] Tests ผ่านใน local environment

---

## 🚨 Emergency Commands

| Situation | Command |
|-----------|---------|
| Undo last commit (keep changes) | `git reset --soft HEAD~1` |
| Undo last commit (discard) | `git reset --hard HEAD~1` |
| Revert specific commit | `git revert <hash>` |
| Force push (⚠️ DANGER) | `git push --force-with-lease origin main` |

### Remove Sensitive File from History
```bash
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch PATH/TO/FILE" --prune-empty --tag-name-filter cat -- --all
```
> ⚠️ **DANGER**: จะเปลี่ยน commit history ทั้งหมด!

---

## 📋 Notes

- 📁 Git Log: `D:/genAI/skn-app/project-log-md/git-log-YYYYMMDD-HHMM.md`
- 🔐 Security checks รันอัตโนมัติด้วย `// turbo` annotation
- ⚠️ หาก auto-run ล้มเหลว ใช้ Manual Commands section
- ✅ **ต้อง verify** ไฟล์ log ถูกสร้างจริงหลัง Push ทุกครั้ง
- 🚀 Best Practice: รัน Security Checks ก่อน Push ทุกครั้ง
