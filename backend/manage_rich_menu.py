import asyncio
import sys
import os

# Ensure backend directory is in path
sys.path.append(os.getcwd())

from app.core.config import settings
from linebot.v3.messaging import Configuration, AsyncApiClient, AsyncMessagingApi

async def main():
    # Initialize API directly to avoid import issues if app structure is complex
    configuration = Configuration(access_token=settings.LINE_CHANNEL_ACCESS_TOKEN)
    async_api_client = AsyncApiClient(configuration)
    line_bot_api = AsyncMessagingApi(async_api_client)

    print("🔍 Fetching Rich Menus...")
    try:
        response = await line_bot_api.get_rich_menu_list()
        # print(f"Debug Response: {response}") # Uncomment if needed
        rich_menus = response.richmenus # Fixed: rich_menus -> richmenus
        
        if not rich_menus:
            print("✅ No Rich Menus found.")
            return

        print(f"Found {len(rich_menus)} Rich Menus:")
        for rm in rich_menus:
            print(f"   - ID: {rm.rich_menu_id}")
            print(f"     Name: {rm.name}")
            print(f"     Bar Text: {rm.chat_bar_text}")
            print("     -----------------------------")
        
        # Handle Deletion
        if len(sys.argv) > 1:
            if sys.argv[1] == '--delete-all':
                print("\n🗑️  Deleting ALL Rich Menus...")
                
                # 1. Unset Default Rich Menu first
                try:
                    await line_bot_api.cancel_default_rich_menu()
                    print("     ✅ Unbound Default Rich Menu")
                except Exception as e:
                    print(f"     (No default set or error: {e})")

                # 2. Delete all definitions
                for rm in rich_menus:
                    await line_bot_api.delete_rich_menu(rm.rich_menu_id)
                    print(f"     Deleted: {rm.rich_menu_id}")
                
                # 3. Unlink from specific users (Nuclear Option)
                try:
                    from app.db.session import AsyncSessionLocal
                    from app.models.message import Message
                    from sqlalchemy import select, distinct
                    
                    print("\n👥 Unlinking from known users in DB...")
                    async with AsyncSessionLocal() as db:
                        result = await db.execute(select(distinct(Message.line_user_id)).filter(Message.line_user_id.isnot(None)))
                        user_ids = result.scalars().all()
                        
                        for uid in user_ids:
                            try:
                                await line_bot_api.unlink_rich_menu_from_user(uid)
                                print(f"     ✅ Unlinked from: {uid}")
                            except Exception as ue:
                                # Ignore if user not found or not linked
                                # print(f"     (Skip {uid}: {ue})")
                                pass
                except ImportError:
                    print("     ⚠️ Could not import DB models to unlink users.")
                except Exception as e:
                    print(f"     ⚠️ Error unlinking users: {e}")

                print("✅ Cleanup complete.")
                
            elif sys.argv[1] == '--delete' and len(sys.argv) > 2:
                target_id = sys.argv[2]
                await line_bot_api.delete_rich_menu(target_id)
                print(f"✅ Deleted: {target_id}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await async_api_client.close()

if __name__ == "__main__":
    asyncio.run(main())
