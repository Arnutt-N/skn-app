import asyncio
import sys
import os
import json
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal

# Resolve path to JSON files
JSON_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../examples/thailand-geodata/json"))

async def import_data():
    print(f"📦 Importing data from {JSON_BASE_PATH}...")
    async with AsyncSessionLocal() as db:
        try:
            # 1. Import Provinces
            print("Importing Provinces...")
            with open(os.path.join(JSON_BASE_PATH, "provinces.json"), encoding="utf-8") as f:
                provinces = json.load(f)["provinces"]
                stmt = text("""
                    INSERT INTO provinces (id, name_th, name_en)
                    VALUES (:id, :name_th, :name_en)
                    ON CONFLICT (id) DO UPDATE SET 
                        name_th = EXCLUDED.name_th,
                        name_en = EXCLUDED.name_en;
                """)
                values = [{"id": p["PROVINCE_ID"], "name_th": p["PROVINCE_THAI"], "name_en": p["PROVINCE_ENGLISH"]} for p in provinces]
                await db.execute(stmt, values)
            
            # 2. Import Districts
            print("Importing Districts...")
            with open(os.path.join(JSON_BASE_PATH, "districts.json"), encoding="utf-8") as f:
                districts = json.load(f)["districts"]
                stmt = text("""
                    INSERT INTO districts (id, province_id, name_th, name_en, code)
                    VALUES (:id, :province_id, :name_th, :name_en, :code)
                    ON CONFLICT (id) DO UPDATE SET 
                        province_id = EXCLUDED.province_id,
                        name_th = EXCLUDED.name_th,
                        name_en = EXCLUDED.name_en,
                        code = EXCLUDED.code;
                """)
                values = [{
                    "id": d["DISTRICT_ID"],
                    "province_id": d["PROVINCE_ID"],
                    "name_th": d["DISTRICT_THAI"],
                    "name_en": d["DISTRICT_ENGLISH"],
                    "code": d.get("DISTRICT_CODE")
                } for d in districts]
                await db.execute(stmt, values)
            
            # 3. Import SubDistricts
            print("Importing SubDistricts...")
            with open(os.path.join(JSON_BASE_PATH, "sub_districts.json"), encoding="utf-8") as f:
                sub_districts = json.load(f)["sub_districts"]
                stmt = text("""
                    INSERT INTO sub_districts (id, district_id, name_th, name_en, postal_code, latitude, longitude)
                    VALUES (:id, :district_id, :name_th, :name_en, :postal_code, :latitude, :longitude)
                    ON CONFLICT (id) DO UPDATE SET 
                        district_id = EXCLUDED.district_id,
                        name_th = EXCLUDED.name_th,
                        name_en = EXCLUDED.name_en,
                        postal_code = EXCLUDED.postal_code,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude;
                """)
                
                # Bulk execute for all sub-districts at once (SQLAlchemy handles the heavy lifting)
                def parse_coord(val):
                    if not val:
                        return None
                    v = str(val).strip()
                    if v == "" or v.lower() == "none":
                        return None
                    try:
                        return float(v)
                    except ValueError:
                        return None

                values = [{
                    "id": s["SUB_DISTRICT_ID"],
                    "district_id": s["DISTRICT_ID"],
                    "name_th": s["SUB_DISTRICT_THAI"],
                    "name_en": s["SUB_DISTRICT_ENGLISH"],
                    "postal_code": s.get("POSTAL_CODE"),
                    "latitude": parse_coord(s.get("LATITUDE")),
                    "longitude": parse_coord(s.get("LONGITUDE"))
                } for s in sub_districts]
                
                await db.execute(stmt, values)
                print(f"Processed {len(sub_districts)} sub-districts.")
            
            await db.commit()
            print("🎉 Data import completed successfully!")
            
        except Exception as e:
            print(f"❌ Error importing data: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(import_data())
