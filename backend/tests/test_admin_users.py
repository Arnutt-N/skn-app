"""Tests for _check_role_permission helper in admin_users."""
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.admin_users import _check_role_permission
from app.models.user import UserRole


def _user(role: UserRole):
    return SimpleNamespace(id=1, role=role)


def test_super_admin_can_manage_super_admin():
    _check_role_permission(_user(UserRole.SUPER_ADMIN), UserRole.SUPER_ADMIN)


def test_super_admin_can_manage_admin():
    _check_role_permission(_user(UserRole.SUPER_ADMIN), UserRole.ADMIN)


def test_super_admin_can_manage_agent():
    _check_role_permission(_user(UserRole.SUPER_ADMIN), UserRole.AGENT)


def test_admin_can_manage_agent():
    _check_role_permission(_user(UserRole.ADMIN), UserRole.AGENT)


def test_admin_cannot_manage_admin():
    with pytest.raises(HTTPException) as exc:
        _check_role_permission(_user(UserRole.ADMIN), UserRole.ADMIN)
    assert exc.value.status_code == 403


def test_admin_cannot_manage_super_admin():
    with pytest.raises(HTTPException) as exc:
        _check_role_permission(_user(UserRole.ADMIN), UserRole.SUPER_ADMIN)
    assert exc.value.status_code == 403


def test_agent_cannot_manage_agent():
    with pytest.raises(HTTPException) as exc:
        _check_role_permission(_user(UserRole.AGENT), UserRole.AGENT)
    assert exc.value.status_code == 403


def test_agent_cannot_manage_super_admin():
    with pytest.raises(HTTPException) as exc:
        _check_role_permission(_user(UserRole.AGENT), UserRole.SUPER_ADMIN)
    assert exc.value.status_code == 403


def test_managing_user_role_has_no_restriction():
    # UserRole.USER has no explicit branch in _check_role_permission,
    # so it should pass without error for any caller
    _check_role_permission(_user(UserRole.AGENT), UserRole.USER)
    _check_role_permission(_user(UserRole.ADMIN), UserRole.USER)
    _check_role_permission(_user(UserRole.SUPER_ADMIN), UserRole.USER)
