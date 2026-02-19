---
name: git-workflow
description: Git workflow standards for SknApp including commit format, branching strategy, and PR practices.
---

# Git Workflow

Standards for consistent, traceable version control across the SknApp project.

## 1. Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Good
feat(auth): add LINE OAuth login
fix(api): resolve 500 error on missing phone field
docs(readme): update setup instructions

# Bad
fixed bug                          # Missing type
update                             # Too vague
feat: fix the issue                # Wrong type
```

## 2. Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(booking): add calendar view` |
| `fix` | Bug fix | `fix(db): handle null phone_number` |
| `docs` | Documentation changes | `docs(api): update swagger specs` |
| `style` | Formatting (no code change) | `style: run black formatter` |
| `refactor` | Code restructuring | `refactor(services): split user service` |
| `perf` | Performance improvement | `perf(query): add index on requests` |
| `test` | Adding/updating tests | `test(auth): add login unit tests` |
| `chore` | Maintenance tasks | `chore(deps): bump pydantic to 2.0` |

## 3. Branch Naming

```
<type>/<short-description>
```

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feature/` | New functionality | `feature/line-webhook` |
| `fix/` | Bug fixes | `fix/login-redirect-loop` |
| `hotfix/` | Critical production fixes | `hotfix/payment-timeout` |
| `release/` | Version releases | `release/v1.2.0` |

```bash
# Create branch
git checkout -b feature/user-profile

# Avoid
git checkout -b my-branch          # Missing prefix
git checkout -b fix                # No description
```

## 4. Workflow Steps

```bash
# 1. Pull latest main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/service-requests

# 3. Make changes and commit
git add .
git commit -m "feat(api): add service request endpoints"

# 4. Push and create PR
git push -u origin feature/service-requests
# Create PR via GitHub UI

# 5. After approval, merge via squash
# Delete branch after merge
git branch -d feature/service-requests
```

## 5. PR Requirements

Every PR must include:

- **Description**: What changed and why
- **Tests**: Unit/integration tests for new code
- **Screenshots**: For UI changes
- **Review**: At least 1 approval

### PR Template

```markdown
## Summary
Brief description of changes

## Changes
- Added X endpoint
- Updated Y component

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
[If applicable]
```

## 6. Handling Merge Conflicts

### Rebase (preferred for clean history)

```bash
git checkout feature/my-branch
git fetch origin
git rebase origin/main

# Resolve conflicts in editor
git add <resolved-file>
git rebase --continue

# Force push after rebase
git push --force-with-lease
```

### Merge (for complex conflicts)

```bash
git checkout feature/my-branch
git fetch origin
git merge origin/main

# Resolve conflicts
git add .
git commit -m "merge: resolve conflicts with main"
git push
```

### Conflict Resolution Example

```bash
# While rebasing, you see:
<<<<<<< HEAD
from app.models import User
=======
from app.models import User, ServiceRequest
>>>>>>> feature/service-requests

# Choose the correct resolution (usually combine):
from app.models import User, ServiceRequest

git add app/models/__init__.py
git rebase --continue
```

## 7. Undoing Changes

| Command | When to Use | Result |
|---------|-------------|--------|
| `git revert <commit>` | Undo a pushed commit | Creates new revert commit, safe for shared history |
| `git reset --soft HEAD~1` | Undo last commit, keep changes | Staged changes remain, use before push |
| `git reset --hard HEAD~1` | Discard last commit entirely | **Destructive** - loses work permanently |
| `git commit --amend` | Fix last commit message | Modifies most recent commit |

```bash
# Fix typo in last commit message
git commit --amend -m "feat(api): add user endpoints"

# Undo last commit but keep changes
git reset --soft HEAD~1

# Revert a pushed commit safely
git revert a1b2c3d
```

## 8. Useful Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --decorate
    last = log -1 HEAD
    amend = commit --amend --no-edit
    undo = reset --soft HEAD~1
```

Usage:

```bash
git st              # git status
git lg              # pretty log graph
git undo            # undo last commit, keep changes
```

## 9. Complete Workflow Example

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/notification-system

# Work and commit
git add app/services/notification.py
git commit -m "feat(notifications): add email service"

git add tests/test_notifications.py
git commit -m "test(notifications): add email service tests"

# Sync with main before PR
git fetch origin
git rebase origin/main

# Push and create PR
git push -u origin feature/notification-system

# After PR approval, squash merge via GitHub
# Then cleanup
git checkout main
git pull origin main
git branch -d feature/notification-system
```

## 10. Common Mistakes to Avoid

| Mistake | Why It's Bad | Solution |
|---------|--------------|----------|
| `git push -f` | Overwrites remote history | Use `--force-with-lease` |
| Committing to `main` directly | Bypasses review | Enable branch protection |
| Large commits with mixed changes | Hard to review/revert | One logical change per commit |
| `git add .` without checking | Commits unwanted files | Use `git add -p` or review with `git diff --cached` |
| No commit messages | No context for changes | Follow commit format strictly |
