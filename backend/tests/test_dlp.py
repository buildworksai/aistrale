import pytest
from unittest.mock import MagicMock
import sys

# Mock dependencies before import
sys.modules["spacy"] = MagicMock()
sys.modules["presidio_analyzer"] = MagicMock()
sys.modules["presidio_anonymizer"] = MagicMock()
sys.modules["presidio_anonymizer.entities"] = MagicMock()

from backend.services.dlp_service import DLPService
from backend.models.dlp_rule import DLPRule, DLPAction

@pytest.fixture
def pii_service_mock():
    mock = MagicMock()
    # Default behavior: no redaction
    mock.redact.side_effect = lambda x: x
    return mock

def test_dlp_scan_clean(pii_service_mock):
    service = DLPService(pii_service_mock)
    is_blocked, text, violations = service.scan_content("Safe content")
    assert is_blocked is False
    assert len(violations) == 0
    assert text == "Safe content"

def test_dlp_block_rule(pii_service_mock):
    service = DLPService(pii_service_mock)
    # The default service has a rule to block "sk-..." patterns
    is_blocked, text, violations = service.scan_content("Here is a token: sk-12345678901234567890")
    assert is_blocked is True
    assert "Blocked by rule" in violations[0]

def test_dlp_redact_rule(pii_service_mock):
    service = DLPService(pii_service_mock)
    # The default service has a rule to redact IPs starting with 10.
    is_blocked, text, violations = service.scan_content("Internal IP is 10.0.0.1")
    assert is_blocked is False
    # Fix assertion: code produces <REDACTED:RuleName> (no space)
    assert "<REDACTED:Redact Internal IPs>" in text
    assert len(violations) > 0

def test_dlp_pii_integration(pii_service_mock):
    # Setup PII mock to actually redact something
    # Must clear side_effect first because fixture sets it
    pii_service_mock.redact.side_effect = None
    pii_service_mock.redact.return_value = "My email is <EMAIL>"
    
    service = DLPService(pii_service_mock)
    is_blocked, text, violations = service.scan_content("My email is test@example.com")
    
    assert text == "My email is <EMAIL>"
