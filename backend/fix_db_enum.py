import sqlalchemy
from sqlalchemy import create_engine, text
import time

# Database URL
DATABASE_URL = "postgresql://postgres:password@localhost:5432/skn_app_db"

def fix():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        engine = create_engine(DATABASE_URL)
        # Check current values
        with engine.connect() as conn:
            print("Checking RequestStatus enum values...")
            try:
                result = conn.execute(text("SELECT unnest(enum_range(NULL::requeststatus))")).fetchall()
                values = [row[0] for row in result]
                print(f"Found values: {values}")
            except Exception as e:
                print(f"Error reading enum: {e}")
                return

            if "AWAITING_APPROVAL" in values:
                print("✅ AWAITING_APPROVAL is ALREADY present.")
                return

        # If we reach here, we need to add it.
        # ALTER TYPE cannot run inside a transaction block.
        print("Attempting to ADD 'AWAITING_APPROVAL'...")
        connection = engine.raw_connection()
        try:
            connection.set_isolation_level(0) # AUTOCOMMIT
            cursor = connection.cursor()
            cursor.execute("ALTER TYPE requeststatus ADD VALUE 'AWAITING_APPROVAL';")
            print("✅ Successfully added 'AWAITING_APPROVAL' to requeststatus enum.")
        except Exception as e:
            print(f"❌ Failed to ALTER TYPE: {e}")
        finally:
            connection.close()
            
    except Exception as e:
        print(f"❌ Critical Error: {e}")

if __name__ == "__main__":
    fix()
