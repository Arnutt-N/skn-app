---
description: วิธี Sync โค้ดล่าสุดจาก Windows ไปยัง WSL และรันแอป
---

# 🔄 Sync & Run in WSL

ใช้ workflow นี้เมื่อคุณแก้ไขโค้ดใน Windows (Drive D:) และต้องการรันใน WSL Native (Home) เพื่อประสิทธิภาพสูงสุด

## ขั้นตอนการทำงาน

### 1. Copy โค้ดล่าสุดไปยัง WSL (แบบเร็ว)
เปิด Terminal ใน WSL (Ubuntu) แล้วรันคำสั่ง:

```bash
# 1. ย้ายไปที่ Home directory
cd ~
mkdir -p projects/skn-app

# 2. Sync ไฟล์ด้วย rsync (เร็วกว่า cp และไม่เอา node_modules มาถ่วง)
# หมายเหตุ: เราไม่เอา node_modules, .next และ config ที่ขัดแย้งกันมา
rsync -av --progress --exclude 'node_modules' --exclude '.next' /mnt/d/genAI/skn-app/frontend ~/projects/skn-app/

# 3. เข้าไปที่โฟลเดอร์
cd projects/skn-app/frontend
```

### 2. ติดตั้ง Dependencies (สำคัญ!)
เนื่องจากเราเพิ่งเพิ่ม `lucide-react` หรือมีการเปลี่ยนแปลง `package.json`:

```bash
# ติดตั้งใหม่ (จะเร็วกว่าเดิมเพราะไม่ต้องลบของเก่าที่ก๊อปมาผิดๆ)
# ลบ config ขยะทิ้งก่อน run เพื่อความชัวร์
# ไม่ต้องลบ config แล้ว เพราะเราต้องการมัน!
npm install
```

### 3. เริ่มรันแอป
```bash
npm run dev
```

---

> [!TIP]
> **ทางลัด (One-liner command) - สูตร Turbo 🚀**
> ใช้คำสั่งนี้แทน เร็วกว่าเดิม 10 เท่า (ปลอดภัย 100%):
>
> `mkdir -p ~/projects/skn-app && rsync -av --exclude 'node_modules' --exclude '.next' /mnt/d/genAI/skn-app/frontend ~/projects/skn-app/ && rsync -av --exclude 'venv' --exclude 'venv_linux' --exclude '__pycache__' --exclude '.pytest_cache' /mnt/d/genAI/skn-app/backend ~/projects/skn-app/ && cd ~/projects/skn-app/frontend && npm install && npm run dev`

### 4. การรัน Backend (แนะนำใช้ uv 🚀)
เปิด Terminal แท็บใหม่ใน WSL:
```bash
# ติดตั้ง uv (ถ้ายังไม่มี)
curl -LsSf https://astral.sh/uv/install.sh | sh

cd ~/projects/skn-app/backend

# สร้าง venv (ถ้ายังไม่มี)
uv venv ../venv_linux

# Activate venv
source ../venv_linux/bin/activate

# Install dependencies (เร็วแรงกว่า pip 100 เท่า)
uv pip install -r requirements.txt

# Run
uvicorn app.main:app --reload --host 0.0.0.0
```
