from linebot.v3.messaging import AsyncMessagingApi, AsyncApiClient
from linebot.v3.webhook import WebhookParser
from linebot.v3.messaging import Configuration

from app.core.config import settings

# Configuration
configuration = Configuration(access_token=settings.LINE_CHANNEL_ACCESS_TOKEN)
async_api_client = AsyncApiClient(configuration)
line_bot_api = AsyncMessagingApi(async_api_client)

# Parser
parser = WebhookParser(settings.LINE_CHANNEL_SECRET)
