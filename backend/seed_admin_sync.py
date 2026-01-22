"""
Simple sync script to create an admin user.
Run: python seed_admin_sync.py
"""
import psycopg2

# Connection string (sync driver)
conn = psycopg2.connect(
    host="localhost",
    database="skn_app_db",
    user="postgres",
    password="password"
)

try:
    cur = conn.cursor()
    
    # Check if users exist
    cur.execute("SELECT count(*) FROM users")
    count = cur.fetchone()[0]
    
    if count == 0:
        print("No users found. Creating Admin Somying...")
        cur.execute("""
            INSERT INTO users (line_user_id, username, display_name, role, is_active, hashed_password, created_at, updated_at)
            VALUES ('U_ADMIN_001', 'admin', 'Admin Somying', 'ADMIN', true, 'hashed_secret', NOW(), NOW())
        """)
        conn.commit()
        print("✅ Admin User created!")
    else:
        print(f"✅ Users already exist ({count} found). No need to seed.")
        
    # Show the user
    cur.execute("SELECT id, username, display_name, role FROM users LIMIT 5")
    print("Users in DB:", cur.fetchall())
    
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
