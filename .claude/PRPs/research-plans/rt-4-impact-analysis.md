## Impact Analysis Report (Import Counts)

### Method and grep patterns used
- File discovery: `rg --files frontend -g '*.ts' -g '*.tsx' -g '!frontend/node_modules/**' -g '!frontend/.next/**'`
- Import parsing regex 1: `(?ms)^\s*import\s+.*?\s+from\s+"([^"]+)"`
- Import parsing regex 2: `(?ms)^\s*import\s+.*?\s+from\s+'([^']+)'`
- Resolution logic: convert alias (`@/...`) and relative imports to concrete file paths, then count distinct importing files.

### Base UI Components (`components/ui/`)
| Component | File | Imports | Importing Pages | Classification | High-Usage |
|---|---|---:|---|---|---|
| ActionIconButton | frontend\components\ui\ActionIconButton.tsx | 4 | frontend\app\admin\auto-replies\page.tsx; frontend\app\admin\reply-objects\page.tsx; frontend\app\admin\requests\page.tsx; frontend\app\admin\rich-menus\page.tsx | KEEP | NO |
| Alert | frontend\components\ui\Alert.tsx | 3 | frontend\app\admin\requests\page.tsx | MATCH | NO |
| Avatar | frontend\components\ui\Avatar.tsx | 2 | - | MATCH | NO |
| Badge | frontend\components\ui\Badge.tsx | 7 | frontend\app\admin\audit\page.tsx; frontend\app\admin\reports\page.tsx; frontend\app\admin\requests\kanban\page.tsx; frontend\app\admin\requests\page.tsx | KEEP | NO |
| Button | frontend\components\ui\Button.tsx | 17 | frontend\app\admin\analytics\page.tsx; frontend\app\admin\audit\page.tsx; frontend\app\admin\auto-replies\page.tsx; frontend\app\admin\reply-objects\page.tsx; frontend\app\admin\reports\page.tsx; frontend\app\admin\requests\kanban\page.tsx; frontend\app\admin\requests\page.tsx; frontend\app\admin\rich-menus\page.tsx; frontend\app\admin\settings\line\page.tsx | KEEP | YES |
| Card | frontend\components\ui\Card.tsx | 11 | frontend\app\admin\analytics\page.tsx; frontend\app\admin\audit\page.tsx; frontend\app\admin\reports\page.tsx; frontend\app\admin\requests\kanban\page.tsx; frontend\app\admin\requests\page.tsx | KEEP | YES |
| Checkbox | frontend\components\ui\Checkbox.tsx | 0 | - | MATCH | NO |
| DropdownMenu | frontend\components\ui\DropdownMenu.tsx | 0 | - | MATCH | NO |
| Input | frontend\components\ui\Input.tsx | 5 | frontend\app\admin\analytics\page.tsx; frontend\app\admin\audit\page.tsx; frontend\app\admin\auto-replies\page.tsx | MATCH | NO |
| Label | frontend\components\ui\Label.tsx | 1 | - | MATCH | NO |
| LoadingSpinner | frontend\components\ui\LoadingSpinner.tsx | 4 | frontend\app\admin\reply-objects\page.tsx; frontend\app\admin\reports\page.tsx; frontend\app\admin\rich-menus\page.tsx; frontend\app\admin\settings\line\page.tsx | KEEP | NO |
| Modal | frontend\components\ui\Modal.tsx | 7 | frontend\app\admin\auto-replies\page.tsx; frontend\app\admin\reply-objects\page.tsx; frontend\app\admin\requests\page.tsx; frontend\app\admin\settings\line\page.tsx | KEEP | NO |
| ModalAlert | frontend\components\ui\ModalAlert.tsx | 0 | - | KEEP | NO |
| Progress | frontend\components\ui\Progress.tsx | 0 | - | MATCH | NO |
| RadioGroup | frontend\components\ui\RadioGroup.tsx | 0 | - | MATCH | NO |
| Select | frontend\components\ui\Select.tsx | 2 | frontend\app\admin\friends\page.tsx | MATCH | NO |
| Separator | frontend\components\ui\Separator.tsx | 0 | - | MATCH | NO |
| Skeleton | frontend\components\ui\Skeleton.tsx | 0 | - | MATCH | NO |
| Switch | frontend\components\ui\Switch.tsx | 0 | - | MATCH | NO |
| Tabs | frontend\components\ui\Tabs.tsx | 0 | - | MATCH | NO |
| Toast | frontend\components\ui\Toast.tsx | 2 | - | KEEP | NO |
| Tooltip | frontend\components\ui\Tooltip.tsx | 2 | - | MATCH | NO |

### Admin Components (`components/admin/`)
| Component | File | Imports | Importing Pages | Classification | High-Usage |
|---|---|---:|---|---|---|
| AdminSearchFilterBar | frontend\components\admin\AdminSearchFilterBar.tsx | 1 | frontend\app\admin\friends\page.tsx | KEEP (domain-specific) | NO |
| AdminTableHead | frontend\components\admin\AdminTableHead.tsx | 3 | frontend\app\admin\auto-replies\page.tsx; frontend\app\admin\friends\page.tsx; frontend\app\admin\rich-menus\page.tsx | KEEP (domain-specific) | NO |
| AssignModal | frontend\components\admin\AssignModal.tsx | 2 | frontend\app\admin\requests\[id]\page.tsx; frontend\app\admin\requests\page.tsx | KEEP (domain-specific) | NO |
| BotStatusIndicator | frontend\components\admin\BotStatusIndicator.tsx | 0 | - | KEEP (domain-specific) | NO |
| CannedResponsePicker | frontend\components\admin\CannedResponsePicker.tsx | 1 | - | KEEP (domain-specific) | NO |
| ConversationActionMenu | frontend\components\admin\ConversationActionMenu.tsx | 0 | - | KEEP (domain-specific) | NO |
| CredentialForm | frontend\components\admin\CredentialForm.tsx | 0 | - | KEEP (domain-specific) | NO |
| SessionTimeoutWarning | frontend\components\admin\SessionTimeoutWarning.tsx | 1 | - | KEEP (domain-specific) | NO |
| TypingIndicator | frontend\components\admin\TypingIndicator.tsx | 0 | - | KEEP (domain-specific) | NO |

### Live Chat Components (`app/admin/live-chat/_components/`)
| Component | File | Imports | Importing Pages | Classification | High-Usage |
|---|---|---:|---|---|---|
| ChatArea | frontend\app\admin\live-chat\_components\ChatArea.tsx | 1 | - | KEEP (domain-specific) | NO |
| ChatHeader | frontend\app\admin\live-chat\_components\ChatHeader.tsx | 1 | - | KEEP (domain-specific) | NO |
| ConversationItem | frontend\app\admin\live-chat\_components\ConversationItem.tsx | 1 | - | KEEP (domain-specific) | NO |
| ConversationList | frontend\app\admin\live-chat\_components\ConversationList.tsx | 1 | - | KEEP (domain-specific) | NO |
| CustomerPanel | frontend\app\admin\live-chat\_components\CustomerPanel.tsx | 1 | - | KEEP (domain-specific) | NO |
| EmojiPicker | frontend\app\admin\live-chat\_components\EmojiPicker.tsx | 1 | - | KEEP (domain-specific) | NO |
| LiveChatShell | frontend\app\admin\live-chat\_components\LiveChatShell.tsx | 1 | frontend\app\admin\live-chat\page.tsx | KEEP (domain-specific) | NO |
| MessageBubble | frontend\app\admin\live-chat\_components\MessageBubble.tsx | 1 | - | KEEP (domain-specific) | NO |
| MessageInput | frontend\app\admin\live-chat\_components\MessageInput.tsx | 1 | - | KEEP (domain-specific) | NO |
| NotificationToast | frontend\app\admin\live-chat\_components\NotificationToast.tsx | 1 | - | KEEP (domain-specific) | NO |
| QuickReplies | frontend\app\admin\live-chat\_components\QuickReplies.tsx | 1 | - | KEEP (domain-specific) | NO |
| SessionActions | frontend\app\admin\live-chat\_components\SessionActions.tsx | 0 | - | KEEP (domain-specific) | NO |
| StickerPicker | frontend\app\admin\live-chat\_components\StickerPicker.tsx | 1 | - | KEEP (domain-specific) | NO |
| TransferDialog | frontend\app\admin\live-chat\_components\TransferDialog.tsx | 1 | - | KEEP (domain-specific) | NO |
| TypingIndicator | frontend\app\admin\live-chat\_components\TypingIndicator.tsx | 1 | - | KEEP (domain-specific) | NO |

### High-Usage Components (10+ imports)
| Component | Import Count | Risk Note |
|---|---:|---|
| Button | 17 | Wide blast radius; keep API stable and avoid breaking variant contracts. |
| Card | 11 | Wide blast radius; keep API stable and avoid breaking variant contracts. |

### Zero-Import Components (potentially dead code)
| Component | File | Notes |
|---|---|---|
| BotStatusIndicator | frontend\components\admin\BotStatusIndicator.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| ConversationActionMenu | frontend\components\admin\ConversationActionMenu.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| CredentialForm | frontend\components\admin\CredentialForm.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| TypingIndicator | frontend\components\admin\TypingIndicator.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| SessionActions | frontend\app\admin\live-chat\_components\SessionActions.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Checkbox | frontend\components\ui\Checkbox.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| DropdownMenu | frontend\components\ui\DropdownMenu.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| ModalAlert | frontend\components\ui\ModalAlert.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Progress | frontend\components\ui\Progress.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| RadioGroup | frontend\components\ui\RadioGroup.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Separator | frontend\components\ui\Separator.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Skeleton | frontend\components\ui\Skeleton.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Switch | frontend\components\ui\Switch.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |
| Tabs | frontend\components\ui\Tabs.tsx | No direct imports found in scanned frontend TS/TSX files. Verify before deletion. |

### ADD Classification (Net-New, Zero-Risk to existing imports)
| Component | Import Count | Classification |
|---|---:|---|
| Table | 0 | ADD (new file; no replacement impact) |
| Popover | 0 | ADD (new file; no replacement impact) |
| Form | 0 | ADD (new file; no replacement impact) |
| Sheet | 0 | ADD (new file; no replacement impact) |
| Pagination | 0 | ADD (new file; no replacement impact) |
| Chart | 0 | ADD (new file; no replacement impact) |
| Calendar | 0 | ADD (new file; no replacement impact) |
| Accordion | 0 | ADD (new file; no replacement impact) |
| Command | 0 | ADD (new file; no replacement impact) |
| Textarea | 0 | ADD (new file; no replacement impact) |

