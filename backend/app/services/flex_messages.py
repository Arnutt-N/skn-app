from linebot.v3.messaging import FlexContainer

def build_request_status_list(requests):
    """
    Build a Flex Message Bubble showing a list of service requests.
    
    Args:
        requests: List of ServiceRequest objects
    """
    
    if not requests:
        return {
            "type": "bubble",
            "body": {
                "type": "box",
                "layout": "vertical",
                "contents": [
                    {
                        "type": "text",
                        "text": "ไม่พบประวัติคำร้องของคุณ",
                        "weight": "bold",
                        "size": "md",
                        "align": "center",
                        "color": "#666666"
                    },
                    {
                        "type": "text",
                        "text": "คุณสามารถส่งข้อความหาเราเพื่อเริ่มเรื่องใหม่ได้เลยครับ",
                        "size": "xs",
                        "align": "center",
                        "color": "#aaaaaa",
                        "wrap": True,
                        "margin": "md"
                    }
                ]
            }
        }

    # Header
    header_box = {
        "type": "box",
        "layout": "vertical",
        "contents": [
            {
                "type": "text",
                "text": "📋 คำร้องของคุณ",
                "weight": "bold",
                "size": "xl",
                "color": "#1DB446"
            },
            {
                "type": "text",
                "text": f"{len(requests)} รายการล่าสุด",
                "size": "xs",
                "color": "#aaaaaa"
            }
        ]
    }

    # Body (List of items)
    body_contents = []
    
    for req in requests:
        # Determine status color and text
        status_map = {
            "PENDING": {"text": "รอดำเนินการ", "color": "#F59E0B"}, # Amber
            "IN_PROGRESS": {"text": "กำลังดำเนินงาน", "color": "#3B82F6"}, # Blue
            "AWAITING_APPROVAL": {"text": "รออนุมัติ", "color": "#6366F1"}, # Indigo
            "COMPLETED": {"text": "เสร็จสิ้น", "color": "#10B981"}, # Emerald
            "REJECTED": {"text": "ยกเลิก/ปฏิเสธ", "color": "#EF4444"} # Rose
        }
        
        status_info = status_map.get(str(req.status), {"text": str(req.status), "color": "#999999"})
        
        # Format Date (Simple Thai Date)
        # Assuming req.created_at is a datetime object
        created_date = req.created_at.strftime("%d/%m/%y") if req.created_at else "-"

        row = {
            "type": "box",
            "layout": "vertical",
            "margin": "lg",
            "spacing": "sm",
            "contents": [
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "text",
                            "text": f"#{req.id} - {req.topic_category or 'ไม่ระบุหมวดหมู่'}",
                            "size": "sm",
                            "color": "#333333",
                            "weight": "bold",
                            "flex": 4,
                            "wrap": True
                        }
                    ]
                },
                {
                    "type": "box",
                    "layout": "horizontal",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "horizontal",
                            "contents": [
                                {
                                    "type": "box",
                                    "layout": "vertical",
                                    "contents": [],
                                    "width": "6px",
                                    "height": "6px",
                                    "backgroundColor": status_info["color"],
                                    "cornerRadius": "3px",
                                    "offsetTop": "6px"
                                },
                                {
                                    "type": "text",
                                    "text": status_info["text"],
                                    "size": "xs",
                                    "color": status_info["color"],
                                    "margin": "sm",
                                    "flex": 0
                                }
                            ],
                            "flex": 0
                        },
                        {
                            "type": "filler"
                        },
                        {
                            "type": "text",
                            "text": created_date,
                            "size": "xs",
                            "color": "#aaaaaa",
                            "align": "end"
                        }
                    ]
                },
                {
                    "type": "separator",
                    "margin": "lg",
                    "color": "#f0f0f0"
                }
            ]
        }
        body_contents.append(row)
        
    # Remove last separator
    if body_contents:
       body_contents[-1]["contents"].pop()

    return {
        "type": "bubble",
        "header": header_box,
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": body_contents
        }
    }
