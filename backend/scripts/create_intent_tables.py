"""Create intent tables directly via SQL"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def create_tables():
    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/skn_db")
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    
    conn = await asyncpg.connect(db_url)
    try:
        # Create intent_categories table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS intent_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL UNIQUE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)
        print("✅ Created intent_categories table")
        
        # Create intent_keywords table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS intent_keywords (
                id SERIAL PRIMARY KEY,
                category_id INTEGER NOT NULL REFERENCES intent_categories(id) ON DELETE CASCADE,
                keyword VARCHAR NOT NULL,
                match_type matchtype NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)
        print("✅ Created intent_keywords table")
        
        # Create intent_responses table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS intent_responses (
                id SERIAL PRIMARY KEY,
                category_id INTEGER NOT NULL REFERENCES intent_categories(id) ON DELETE CASCADE,
                reply_type replytype NOT NULL,
                text_content TEXT,
                media_id UUID REFERENCES media_files(id),
                payload JSONB,
                "order" INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """)
        print("✅ Created intent_responses table")
        
        # Create indexes
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_intent_categories_id ON intent_categories(id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_intent_categories_name ON intent_categories(name);")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_intent_keywords_id ON intent_keywords(id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_intent_keywords_keyword ON intent_keywords(keyword);")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_intent_responses_id ON intent_responses(id);")
        print("✅ Created indexes")
        
        # Update alembic_version
        await conn.execute("UPDATE alembic_version SET version_num = '8a9b1c2d3e4f'")
        print("✅ Updated alembic version")
        
        print("\n🎉 All intent tables created successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(create_tables())
