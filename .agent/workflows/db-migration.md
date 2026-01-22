---
description: [db-migration] จัดการ Database Migration ด้วย Alembic
---

# Workflow: Database Migration (Alembic)

## Purpose
ใช้สำหรับจัดการการเปลี่ยนแปลงของ Database Schema (Models) ให้ Sync กับฐานข้อมูล PostgreSQL โดยอัตโนมัติ

## Steps

### 1. ตรวจสอบสถานะปัจจุบัน
// turbo
```bash
cd backend
alembic current
```

### 2. สร้าง Migration Script ใหม่ (Autogenerate)
เมื่อมีการแก้ไขไฟล์ใน `backend/app/models/` ให้รันคำสั่งนี้:
```bash
cd backend
alembic revision --autogenerate -m "คำอธิบายการเปลี่ยนแปลง เช่น add_new_table"
```

### 3. อัปเกรดฐานข้อมูลให้เป็นเวอร์ชันล่าสุด
// turbo
```bash
cd backend
alembic upgrade head
```

### 4. ตรวจสอบประวัติการ Migration
```bash
cd backend
alembic history --verbose
```

### 5. วิธีย้อนกลับ (Rollback)
หากต้องการยกเลิกการ Migration ล่าสุด:
```bash
cd backend
alembic downgrade -1
```

## Verification
รันคำสั่ง `alembic current` อีกครั้งเพื่อยืนยันว่า (head) ตรงกับเวอร์ชันล่าสุดที่สร้างขึ้น
