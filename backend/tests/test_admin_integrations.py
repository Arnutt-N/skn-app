"""Tests for _mask helper in admin_integrations."""
from app.api.v1.endpoints.admin_integrations import _mask


def test_mask_empty_string():
    assert _mask("") == "****"


def test_mask_short_string():
    assert _mask("abc") == "****"


def test_mask_exactly_six():
    assert _mask("abcdef") == "****"


def test_mask_seven_chars():
    result = _mask("abcdefg")
    assert result == "abc****efg"


def test_mask_long_token():
    result = _mask("123456789abcdef")
    assert result == "123****def"


def test_mask_boundary_at_seven():
    # len=7 -> show first 3 + **** + last 3
    result = _mask("1234567")
    assert result == "123****567"


def test_mask_none_returns_stars():
    # _mask guards with `not value` which catches None
    assert _mask(None) == "****"
