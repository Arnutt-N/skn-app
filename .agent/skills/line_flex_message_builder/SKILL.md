---
name: flex-message-builder
description: Building and managing LINE Flex Message templates with placeholder system and dynamic content injection.
---

# LINE Flex Message Builder

## Overview

**Store templates as data, not code.** Hardcoding JSON in business logic creates maintenance nightmares.

- **Separation of Concerns**: Designers update templates; developers focus on data
- **Runtime Updates**: Change messaging without redeployment
- **Reusability**: One template, multiple contexts
- **Testing**: Test templates independently from application logic

## Resources

- **Template Gallery**: See [assets/templates/](assets/templates/) - Ready-to-use templates for tickets, notifications, and carousels
- **Component Reference**: See [references/component_reference.md](references/component_reference.md) - Complete Flex Message component catalog

## Template Storage

### Database Storage (Recommended)
```sql
CREATE TABLE flex_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    template JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Pros**: Versioning, runtime updates, multi-tenant support  
**Cons**: Slightly more complex, requires caching

### File Storage
```
templates/
  flex/
    ticket_card.json
    notification.json
    menu_carousel.json
```

**Pros**: Simple, version-controlled, fast loading  
**Cons**: Requires redeployment for updates

## Placeholder System

Use `{{ variable }}` pattern for dynamic injection:

```json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "{{ title }}",
        "weight": "bold",
        "size": "xl"
      },
      {
        "type": "text",
        "text": "{{ description }}",
        "size": "sm",
        "color": "{{ description_color|default('#666666') }}"
      }
    ]
  }
}
```

**Features**:
- Simple replacement: `{{ name }}`
- Default values: `{{ status|default('Pending') }}`
- Conditional blocks: `{{#if condition}}...{{/if}}`

## Flex Message Types

### Bubble
Single card with header, body, footer (optional).

```json
{
  "type": "bubble",
  "size": "kilo",
  "header": { "type": "box", "layout": "vertical", "contents": [] },
  "body": { "type": "box", "layout": "vertical", "contents": [] },
  "footer": { "type": "box", "layout": "vertical", "contents": [] }
}
```

**Sizes**: `nano` (120px), `micro` (140px), `kilo` (210px), `mega` (300px), `giga` (500px)

### Carousel
Horizontal scroll of multiple bubbles.

```json
{
  "type": "carousel",
  "contents": [
    { "type": "bubble", ... },
    { "type": "bubble", ... }
  ]
}
```

## Renderer Service Implementation

```python
import json
import re
from typing import Dict, Any, Optional

class FlexRenderer:
    """Renders Flex Message templates with placeholder replacement."""
    
    PLACEHOLDER_PATTERN = re.compile(r'\{\{\s*(\w+)(?:\|\|([^}]+))?\s*\}\}')
    
    def __init__(self, template_store):
        self.store = template_store  # DB or file loader
    
    def render(self, template_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Render template with data injection."""
        template = self.store.get(template_name)
        template_str = json.dumps(template)
        
        def replace_placeholder(match):
            key = match.group(1)
            default = match.group(2)
            value = data.get(key, default)
            if value is None:
                raise ValueError(f"Missing required placeholder: {key}")
            return str(value)
        
        rendered = self.PLACEHOLDER_PATTERN.sub(replace_placeholder, template_str)
        return json.loads(rendered)
    
    def render_safe(self, template_name: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Safe render with error handling."""
        try:
            return self.render(template_name, data)
        except Exception as e:
            # Log error, return fallback
            return None

# Database-backed store
class DatabaseTemplateStore:
    def __init__(self, session):
        self.session = session
    
    def get(self, name: str) -> Dict[str, Any]:
        result = self.session.execute(
            "SELECT template FROM flex_templates WHERE name = :name",
            {"name": name}
        )
        row = result.fetchone()
        if not row:
            raise ValueError(f"Template not found: {name}")
        return row.template
```

## Validation

Always validate before sending to avoid API errors:

```python
from jsonschema import validate, ValidationError

FLEX_MESSAGE_SCHEMA = {
    "type": "object",
    "required": ["type"],
    "properties": {
        "type": {"enum": ["bubble", "carousel"]},
        "size": {"enum": ["nano", "micro", "kilo", "mega", "giga"]},
        "contents": {"type": "array"}
    }
}

def validate_flex_message(message: dict) -> bool:
    try:
        validate(instance=message, schema=FLEX_MESSAGE_SCHEMA)
        return True
    except ValidationError as e:
        print(f"Validation error: {e.message}")
        return False
```

## Sending via LINE API

```python
import requests
from typing import Dict, Any

class LineMessageClient:
    def __init__(self, channel_access_token: str):
        self.headers = {
            "Authorization": f"Bearer {channel_access_token}",
            "Content-Type": "application/json"
        }
        self.base_url = "https://api.line.me/v2/bot/message"
    
    def send_flex_message(
        self, 
        user_id: str, 
        alt_text: str, 
        flex_content: Dict[str, Any]
    ) -> bool:
        """Send Flex Message to a user."""
        payload = {
            "to": user_id,
            "messages": [
                {
                    "type": "flex",
                    "altText": alt_text,
                    "contents": flex_content
                }
            ]
        }
        
        response = requests.post(
            f"{self.base_url}/push",
            headers=self.headers,
            json=payload
        )
        return response.status_code == 200
    
    def send_flex_to_multiple(
        self, 
        user_ids: list, 
        alt_text: str, 
        flex_content: Dict[str, Any]
    ) -> bool:
        """Multicast Flex Message (max 500 users)."""
        if len(user_ids) > 500:
            raise ValueError("Max 500 users per multicast")
        
        payload = {
            "to": user_ids,
            "messages": [
                {
                    "type": "flex",
                    "altText": alt_text,
                    "contents": flex_content
                }
            ]
        }
        
        response = requests.post(
            f"{self.base_url}/multicast",
            headers=self.headers,
            json=payload
        )
        return response.status_code == 200

# Usage Example
client = LineMessageClient(channel_access_token="YOUR_TOKEN")
renderer = FlexRenderer(template_store=db_store)

# Render and send
ticket_data = {
    "ticket_id": "TKT-001",
    "title": "Server Down",
    "status": "In Progress",
    "status_color": "#FFA500",
    "priority": "High",
    "header_color": "#FF6B6B",
    "ticket_url": "https://helpdesk.example.com/tickets/001"
}

flex_content = renderer.render("ticket_card", ticket_data)
success = client.send_flex_message(
    user_id="U1234567890abcdef",
    alt_text="New ticket: Server Down",
    flex_content=flex_content
)
```

## Testing

### LINE Simulator
Use the [LINE Flex Message Simulator](https://developers.line.me/flex-simulator/) to:
- Preview JSON output in real-time
- Test different device sizes
- Copy validated JSON

### Unit Testing
```python
def test_ticket_card_rendering():
    renderer = FlexRenderer(template_store=mock_store)
    
    data = {
        "ticket_id": "TKT-TEST",
        "title": "Test Ticket",
        "status": "Open",
        "status_color": "#00B900",
        "priority": "Medium",
        "ticket_url": "https://test.com"
    }
    
    result = renderer.render("ticket_card", data)
    
    assert result["type"] == "bubble"
    assert result["header"]["contents"][0]["text"] == "TKT-TEST"
    assert "{{" not in json.dumps(result)  # No unrendered placeholders
```

## Quick Reference

| Task | Code |
|------|------|
| Render template | `renderer.render("template_name", data)` |
| Send to user | `client.send_flex_message(user_id, alt_text, content)` |
| Multicast | `client.send_flex_to_multiple(user_ids, alt_text, content)` |
| Validate | `validate_flex_message(content)` |
| Default value | `{{ name\|default('Guest') }}` |
