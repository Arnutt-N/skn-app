"""
Import data from CSV to auto_replies table.
Based on legacy Google Apps Script format (enhancedQAMessages.gs)
"""
import asyncio
import csv
import sys
import os
import httpx
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal
from app.models.auto_reply import AutoReply, ReplyType, MatchType
from app.models.media_file import MediaFile

sys.path.append(os.getcwd())

CSV_FILE = r"D:\genAI\skn-app\examples\moj-skn-bot-examples.csv"

# NOTE: For Flex images, LINE requires HTTPS URLs accessible from LINE servers.
# We will store the original URLs directly in the payload. 
# If storing locally, we'd need an absolute HTTPS URL to our media endpoint.

def create_flex_bubble(image_url, alt_text, aspect_ratio="3:2", size="full", aspect_mode="cover"):
    """
    Create a single bubble for Flex Carousel (matches legacy createFlexImageCarousel bubble structure)
    """
    # Parse aspect ratio format (e.g., "842:1191" -> "842:1191" or normalize common ones)
    final_aspect_ratio = aspect_ratio if aspect_ratio else "3:2"
    
    return {
        "type": "bubble",
        "hero": {
            "type": "image",
            "url": image_url.strip(),
            "size": size or "full",
            "aspectMode": aspect_mode or "cover",
            "aspectRatio": final_aspect_ratio,
            "action": {
                "type": "uri",
                "uri": image_url.strip()  # Open same image when tapped
            }
        }
    }

def create_flex_carousel_payload(image_urls: list, alt_text: str, aspect_ratio: str = None, size: str = None, aspect_mode: str = None):
    """
    Create Flex Carousel payload matching legacy structure.
    This is the "contents" field for a FlexMessage.
    Structure: {"type": "carousel", "contents": [bubbles]}
    """
    bubbles = []
    for url in image_urls:
        if url and url.strip():
            bubbles.append(create_flex_bubble(url, alt_text, aspect_ratio, size, aspect_mode))
    
    if not bubbles:
        return None
    
    # Single bubble = just return the bubble (not carousel)
    if len(bubbles) == 1:
        return bubbles[0]
    
    # Multiple = carousel
    return {
        "type": "carousel",
        "contents": bubbles
    }

async def process_row(db, row, row_num):
    # Handle BOM in column names
    intent_category = row.get('\ufeffintent_category') or row.get('intent_category', '')
    intent = row.get('intent', '').strip()
    msg_type = row.get('msg_type', '').strip()
    response_text = row.get('response', '').strip()
    image_type = row.get('image_type', '').strip()  # single, flex_carousel
    image_data = row.get('image_data', '').strip()
    full_size_urls_str = row.get('full_size_urls', '').strip()
    aspect_ratio = row.get('aspect_ratio', '3:2').strip()
    size = row.get('size', 'full').strip()
    aspect_mode = row.get('aspect_mode', 'cover').strip()
    
    if not intent or not msg_type:
        return

    print(f"[{row_num}] Processing: {intent} ({msg_type})")

    # Check for duplicate
    existing = await db.execute(select(AutoReply).filter(AutoReply.keyword == intent))
    if existing.scalars().first():
        print(f"       Skipped (Duplicate): {intent}")
        return

    # 1. Text Message
    if msg_type == 'text':
        reply = AutoReply(
            keyword=intent,
            match_type=MatchType.EXACT,  # Legacy uses exact match
            reply_type=ReplyType.TEXT,
            text_content=response_text
        )
        db.add(reply)
        print(f"       + Added TEXT")
    
    # 2. Flex Message (Carousel / Single)
    elif msg_type == 'flex':
        # Parse image URLs from full_size_urls or image_data
        urls_str = full_size_urls_str or image_data
        if not urls_str:
            print(f"       ! Warning: No image URLs for flex, skipping")
            return
        
        image_urls = [u.strip() for u in urls_str.split(',') if u.strip()]
        
        # Build Flex payload
        payload = create_flex_carousel_payload(
            image_urls=image_urls,
            alt_text=intent,
            aspect_ratio=aspect_ratio,
            size=size,
            aspect_mode=aspect_mode
        )
        
        if not payload:
            print(f"       ! Warning: Failed to create Flex payload")
            return
        
        reply = AutoReply(
            keyword=intent,
            match_type=MatchType.EXACT,
            reply_type=ReplyType.FLEX,
            text_content=response_text,  # Fallback text
            payload=payload
        )
        db.add(reply)
        print(f"       + Added FLEX ({len(image_urls)} images)")

async def main():
    async with AsyncSessionLocal() as db:
        rows = []
        try:
            with open(CSV_FILE, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    rows.append(row)
        except Exception as e:
            print(f"Error reading CSV: {e}")
            return

        print(f"Found {len(rows)} rows. Importing...\n")
        
        for i, row in enumerate(rows, 1):
            await process_row(db, row, i)
        
        await db.commit()
        print("\n✅ Import Completed!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
