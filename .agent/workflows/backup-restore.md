---
description: [db-restore] สำรองและกู้คืนฐานข้อมูล PostgreSQL
---

# Workflow: Database Backup & Restore

## Purpose
ใช้สำหรับสำรองข้อมูล (Backup) และกู้คืนข้อมูล (Restore) ของฐานข้อมูล `skn_app_db` เพื่อป้องกันข้อมูลสูญหาย

## Steps

### 1. สร้างโฟลเดอร์สำหรับเก็บ Backup
// turbo
```bash
if not exist "D:\genAI\skn-app\backups" mkdir "D:\genAI\skn-app\backups"
```

### 2. สำรองข้อมูล (Backup)
รันคำสั่ง `pg_dump` เพื่อสร้างไฟล์ `.sql` (ตั้งชื่อตามวันที่-เวลา)
```bash
pg_dump -U postgres -h localhost skn_app_db > "D:\genAI\skn-app\backups\backup_%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%.sql"
```
*หมายเหตุ: หากรันบน Terminal แล้วระบุ password ไม่ได้ ให้กำหนด `SET PGPASSWORD=password` ก่อน*

### 3. ตรวจสอบไฟล์ Backup
// turbo
```bash
dir "D:\genAI\skn-app\backups"
```

### 4. กู้คืนข้อมูล (Restore)
**คำเตือน: การ Restore จะทับข้อมูลปัจจุบัน**
1. ลบ DB เดิม (ถ้าต้องการล้างใหม่): `dropdb -U postgres skn_app_db`
2. สร้าง DB ใหม่: `createdb -U postgres skn_app_db`
3. กู้คืนจากไฟล์:
```bash
psql -U postgres -d skn_app_db < "D:\genAI\skn-app\backups\FILENAME.sql"
```

## Troubleshooting
หากคำสั่ง `pg_dump` ไม่ทำงาน:
1. ตรวจสอบว่าได้ติดตั้ง PostgreSQL และเพิ่ม Bin folder ใน System PATH หรือยัง
2. หรือใช้ Path เต็ม เช่น `"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"`
