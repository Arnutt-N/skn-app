---
name: skn-line-flex-builder
description: >
  Creates LINE Flex Message content for the SKN App (JskApp) backend using the
  project's exact linebot.v3.messaging SDK patterns, builder function style,
  and LineService sending methods. Use when asked to "create flex message",
  "add LINE notification", "build LINE card", "LINE message template",
  "สร้าง flex message", "เพิ่ม LINE notification", "สร้าง LINE card",
  "ส่งข้อความ LINE", or any outbound LINE message with rich UI.
  Do NOT use for webhook event parsing, Rich Menu management, or LIFF apps.
license: MIT
compatibility: >
  SKN App (JskApp) backend. Python 3.11+, linebot.v3.messaging SDK,
  FastAPI async. Sending always goes through line_service singleton.
metadata:
  author: SKN App Team
  version: 1.0.0
  project: skn-app
  category: line
  tags: [line, flex-message, linebot, messaging, notification]
---

# skn-line-flex-builder

Creates LINE Flex Message content for the SKN App backend, following all
project-specific patterns extracted from the live codebase.

---

## CRITICAL: Project-Specific Rules

These rules are non-negotiable and must be followed every time:

1. **Builder function pattern** — Every flex content is a `build_*` function returning a `dict`; never inline JSON in endpoint code
2. **Send via `line_service`** — Always use `line_service.reply_flex()` or `line_service.push_messages()`; never call `api.reply_message()` directly from endpoints
3. **`FlexContainer.from_dict(contents)`** — This is the conversion bridge; `reply_flex()` calls it internally — you only pass the raw `dict`
4. **`linebot.v3.messaging` SDK** — Import `FlexMessage`, `FlexContainer`, `TextMessage` from `linebot.v3.messaging`, not `linebot.v2`
5. **Circuit breaker is handled** — `LineService._call_with_circuit()` wraps all API calls; your code just calls `await line_service.reply_flex(...)` and lets it raise
6. **Max 5 messages per call** — `push_messages()` and `reply_messages()` both slice `messages[:5]`
7. **Alt text is required** — Always provide meaningful `alt_text` for accessibility on devices that cannot render Flex
8. **Thai text is acceptable** — Flex content strings (labels, status text) may be in Thai for user-facing messages

---

## SKN App Status Color Map

Use these exact colors for service request statuses throughout the project:

```python
STATUS_MAP = {
    "PENDING":           {"text": "รอดำเนินการ",     "color": "#F59E0B"},  # Amber
    "IN_PROGRESS":       {"text": "กำลังดำเนินงาน", "color": "#3B82F6"},  # Blue
    "AWAITING_APPROVAL": {"text": "รออนุมัติ",        "color": "#6366F1"},  # Indigo
    "COMPLETED":         {"text": "เสร็จสิ้น",        "color": "#10B981"},  # Emerald
    "REJECTED":          {"text": "ยกเลิก/ปฏิเสธ",   "color": "#EF4444"},  # Rose
}
```

---

## Context7 Docs

Context7 MCP is active in this project. Use it to look up LINE Flex Message
component properties and `linebot.v3.messaging` SDK classes before writing code.

**Relevant libraries:**

| Library | Resolve Name | Key Topics |
|---|---|---|
| LINE Bot SDK (Python) | `"line-bot-sdk-python"` | FlexMessage, FlexContainer, QuickReply |
| LINE Messaging API | `"line-messaging-api"` | Flex Message reference, component schemas |

**Usage:**
```
# 1. Resolve to Context7 library ID
mcp__context7__resolve-library-id  libraryName="line-bot-sdk-python"
→ { context7CompatibleLibraryID: "/line/line-bot-sdk-python" }

# 2. Fetch targeted docs
mcp__context7__get-library-docs
    context7CompatibleLibraryID="/line/line-bot-sdk-python"
    topic="FlexMessage FlexContainer v3"
    tokens=5000
```

When to use: verifying `linebot.v3.messaging` class names (v3 module paths differ
from v2), `FlexContainer` constructor, `QuickReply` / `QuickReplyItem` SDK objects,
or checking Flex component property constraints.

---

## Step 1: Understand the Requirement

Before writing any code, answer:

- **What container type?** `bubble` (single card) or `carousel` (horizontal scroll of bubbles)
- **Reply or Push?** Reply = inside webhook handler (has `reply_token`). Push = initiated by admin/system (needs `line_user_id`)
- **What data drives the content?** Model attributes → flex text/colors
- **Is Thai text needed?** Status labels, user-facing copy → Thai. Admin-only → English OK
- **Quick Reply buttons needed?** (appears below the message as tap targets)

File where new builder functions live:
```
backend/app/services/flex_messages.py    ← add new build_*() functions here
```

---

## Step 2: Create the Builder Function

Add to `backend/app/services/flex_messages.py`:

```python
def build_[name](data_object) -> dict:
    """
    Build a Flex Message bubble/carousel for [purpose].

    Args:
        data_object: The model or data dict to render.

    Returns:
        dict: Flex container ready for FlexContainer.from_dict()
    """

    # ── Status color lookup (if status-driven) ──────────────────────
    status_map = {
        "PENDING":           {"text": "รอดำเนินการ",     "color": "#F59E0B"},
        "IN_PROGRESS":       {"text": "กำลังดำเนินงาน", "color": "#3B82F6"},
        "AWAITING_APPROVAL": {"text": "รออนุมัติ",        "color": "#6366F1"},
        "COMPLETED":         {"text": "เสร็จสิ้น",        "color": "#10B981"},
        "REJECTED":          {"text": "ยกเลิก/ปฏิเสธ",   "color": "#EF4444"},
    }
    status_info = status_map.get(str(data_object.status), {"text": str(data_object.status), "color": "#999999"})

    # ── Date formatting ──────────────────────────────────────────────
    created_date = data_object.created_at.strftime("%d/%m/%y") if data_object.created_at else "-"

    # ── Build and return ─────────────────────────────────────────────
    return {
        "type": "bubble",
        "size": "kilo",                       # nano/micro/kilo/mega/giga
        "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#1DB446",
            "paddingAll": "md",
            "contents": [
                {
                    "type": "text",
                    "text": f"#{data_object.id}",
                    "color": "#ffffff",
                    "weight": "bold",
                    "size": "sm"
                }
            ]
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "paddingAll": "lg",
            "contents": [
                {
                    "type": "text",
                    "text": data_object.title or "ไม่มีชื่อเรื่อง",
                    "weight": "bold",
                    "size": "lg",
                    "wrap": True
                },
                {"type": "separator", "margin": "md"},
                # ── Key-value row ──
                {
                    "type": "box",
                    "layout": "horizontal",
                    "margin": "md",
                    "contents": [
                        {"type": "text", "text": "สถานะ:", "size": "sm", "color": "#666666", "flex": 2},
                        {
                            "type": "text",
                            "text": status_info["text"],
                            "size": "sm",
                            "color": status_info["color"],
                            "weight": "bold",
                            "flex": 3
                        }
                    ]
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {"type": "text", "text": "วันที่:", "size": "sm", "color": "#666666", "flex": 2},
                        {"type": "text", "text": created_date, "size": "sm", "color": "#333333", "flex": 3}
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "action": {
                        "type": "uri",
                        "label": "ดูรายละเอียด",
                        "uri": f"{settings.SERVER_BASE_URL}/liff/requests/{data_object.id}"
                    }
                }
            ]
        }
    }
```

---

## Step 3: Send the Flex Message

### 3a. Reply Flex (inside webhook handler)

```python
from app.services.flex_messages import build_[name]
from app.services.line_service import line_service

# In webhook handler or service method:
flex_content = build_[name](data_object)
await line_service.reply_flex(
    reply_token=event.reply_token,
    alt_text="[Descriptive alt text for devices without Flex support]",
    contents=flex_content
)
```

### 3b. Push Flex (proactive, no reply token)

```python
from linebot.v3.messaging import FlexMessage, FlexContainer
from app.services.flex_messages import build_[name]
from app.services.line_service import line_service

# Build the message object for push:
flex_content = build_[name](data_object)
container = FlexContainer.from_dict(flex_content)
flex_msg = FlexMessage(alt_text="[Descriptive alt text]", contents=container)

await line_service.push_messages(
    line_user_id=user.line_user_id,
    messages=[flex_msg]
)
```

### 3c. Push Mixed Messages (Flex + Text)

```python
from linebot.v3.messaging import TextMessage, FlexMessage, FlexContainer

flex_content = build_[name](data_object)
container = FlexContainer.from_dict(flex_content)

await line_service.push_messages(
    line_user_id=user.line_user_id,
    messages=[
        TextMessage(text="มีการอัพเดทคำร้องของคุณ 📋"),    # text first
        FlexMessage(alt_text="อัพเดทสถานะ", contents=container)
    ]
)
```

---

## Step 4: Build a Carousel (multiple bubbles)

```python
def build_[resource]_carousel(items: list) -> dict:
    """Build a horizontal-scroll carousel of item cards."""

    if not items:
        # Fallback to single bubble when list is empty
        return {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": "ไม่มีข้อมูล", "align": "center", "color": "#aaaaaa"}
                ]
            }
        }

    bubbles = []
    for item in items[:10]:  # LINE carousel: max 10 bubbles
        bubble = {
            "type": "bubble",
            "size": "micro",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {"type": "text", "text": item.title, "weight": "bold", "size": "sm", "wrap": True},
                    {"type": "text", "text": item.description or "", "size": "xs", "color": "#666666", "margin": "sm", "wrap": True}
                ]
            },
            "footer": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "button",
                        "style": "primary",
                        "height": "sm",
                        "action": {
                            "type": "postback",
                            "label": "เลือก",
                            "data": f"action=select&id={item.id}",
                            "displayText": f"เลือก: {item.title}"
                        }
                    }
                ]
            }
        }
        bubbles.append(bubble)

    return {"type": "carousel", "contents": bubbles}
```

---

## Step 5: Add Quick Reply Buttons (optional)

Quick reply buttons appear below a message as tap targets. They attach to any message type, including text.

```python
from linebot.v3.messaging import (
    TextMessage,
    QuickReply,
    QuickReplyItem,
    MessageAction,
    PostbackAction,
    URIAction
)

# Quick reply attached to a text message
text_with_quick_reply = TextMessage(
    text="คุณต้องการทำอะไร?",
    quick_reply=QuickReply(
        items=[
            QuickReplyItem(action=MessageAction(label="ดูคำร้อง", text="ดูคำร้องของฉัน")),
            QuickReplyItem(action=MessageAction(label="ส่งคำร้องใหม่", text="ส่งคำร้องใหม่")),
            QuickReplyItem(action=PostbackAction(
                label="ติดต่อเจ้าหน้าที่",
                data="action=contact_agent",
                display_text="ติดต่อเจ้าหน้าที่"
            )),
        ]
    )
)

await line_service.push_messages(
    line_user_id=user.line_user_id,
    messages=[text_with_quick_reply]
)
```

---

## Step 6: Test

1. Copy the output dict from your builder function
2. Open [LINE Flex Message Simulator](https://developers.line.biz/flex-simulator/)
3. Paste JSON → preview on iOS/Android
4. Make sure `altText` is meaningful — it's shown on notifications and watch faces

Quick smoke test in Python:
```python
import json
from app.services.flex_messages import build_[name]

# Mock data object
class MockRequest:
    id = 1
    title = "ทดสอบ"
    status = "PENDING"
    created_at = None
    topic_category = "กฎหมาย"

result = build_[name](MockRequest())
print(json.dumps(result, ensure_ascii=False, indent=2))
assert result["type"] in ("bubble", "carousel"), "Must be bubble or carousel"
assert "{{" not in json.dumps(result), "No unrendered placeholders"
```

---

## Examples

### Example 1: Notification on Request Status Change

**User says:** "ส่ง flex message ให้ user เมื่อ status ของ service request เปลี่ยน"

**Actions:**
1. In `flex_messages.py`, add `build_status_update_notification(request)` returning a bubble
2. In the endpoint/service that changes status, import and call it
3. Push via `line_service.push_messages()` (no reply token available after status change)

### Example 2: Service Request List Reply

**User says:** "ตอบ LINE user ด้วย flex message แสดงรายการ request ของเขา"

**Actions:**
1. `build_request_status_list(requests)` already exists in `flex_messages.py` — reuse it
2. In webhook handler: `await line_service.reply_flex(reply_token, "คำร้องของคุณ", flex_content)`

### Example 3: Carousel of Services

**User says:** "สร้าง carousel แสดงรายการบริการให้ user เลือก"

**Actions:**
1. Add `build_service_carousel(services: list)` to `flex_messages.py`
2. Each bubble = one service with postback action
3. Reply with carousel from webhook handler

---

## Common Issues

### `FlexContainer.from_dict()` raises `ValueError`
**Cause:** The dict has an invalid key or missing required property.
**Fix:** Validate JSON structure in [LINE Flex Simulator](https://developers.line.biz/flex-simulator/) first.

### Flex message renders incorrectly on iOS vs Android
**Cause:** `cornerRadius`, `offsetTop`, `width/height` in px behave differently across platforms.
**Fix:** Test with LINE Simulator's iOS and Android preview modes. Prefer percentage-based flex over pixel sizes.

### `RuntimeError: LINE API circuit is open`
**Cause:** `line_service` has hit 5 consecutive failures — circuit is open.
**Fix:** This is expected circuit breaker behavior. The circuit auto-resets after 30 seconds. Log the error and queue for retry.

### Reply token already used / expired
**Cause:** Reply tokens expire in 1 minute and can only be used once.
**Fix:** Use `push_messages()` for delayed sends. Only use `reply_flex()` immediately in the same webhook handler.

### Carousel has no items / empty list
**Cause:** Returning an empty carousel `{"type": "carousel", "contents": []}` is invalid.
**Fix:** Always guard with empty-state fallback bubble, as shown in Step 4.

---

## Quality Checklist

Before finishing, verify:
- [ ] Builder function added to `backend/app/services/flex_messages.py`
- [ ] Function returns a plain `dict` (not `FlexContainer`, not `FlexMessage`)
- [ ] `altText` is descriptive and meaningful (shown on watch/notification)
- [ ] Carousel: max 10 bubbles, empty-state fallback included
- [ ] Thai status text uses the project status map (not hardcoded English)
- [ ] Date formatted with `.strftime("%d/%m/%y")`
- [ ] Reply sends via `line_service.reply_flex()`, Push via `line_service.push_messages()`
- [ ] Tested in LINE Flex Simulator before deploying

---

*See `references/component_reference.md` for complete Box/Text/Image/Button/Action property tables.*
*See `assets/templates/` for ready-to-use JSON templates for the SKN App.*
