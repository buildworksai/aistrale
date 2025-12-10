import pytest
from unittest.mock import MagicMock, patch
import sys

# Mock dependencies before import
sys.modules["spacy"] = MagicMock()
sys.modules["presidio_analyzer"] = MagicMock()
sys.modules["presidio_anonymizer"] = MagicMock()
sys.modules["presidio_anonymizer.entities"] = MagicMock()

# Now import the service
from app.services.pii_detection_service import PIIDetectionService

@pytest.fixture
def pii_service():
    with patch("spacy.util.is_package", return_value=True):
        service = PIIDetectionService()
        return service

def test_pii_initialization(pii_service):
    assert pii_service is not None
    assert pii_service.analyzer is not None
    assert pii_service.anonymizer is not None

def test_analyze_no_pii(pii_service):
    text = "Hello world, this is a safe string."
    # Mock return value of the mocked analyzer
    pii_service.analyzer.analyze.return_value = []
    
    results = pii_service.analyze(text)
    assert len(results) == 0

def test_analyze_with_pii(pii_service):
    mock_result = MagicMock()
    mock_result.entity_type = "EMAIL_ADDRESS"
    mock_result.start = 0
    mock_result.end = 10
    
    pii_service.analyzer.analyze.return_value = [mock_result]
    
    results = pii_service.analyze("test@example.com")
    assert len(results) == 1
    assert results[0].entity_type == "EMAIL_ADDRESS"

def test_redact(pii_service):
    pii_service.analyzer.analyze.return_value = []
    pii_service.anonymizer.anonymize.return_value.text = "<REDACTED>"
    
    result = pii_service.redact("My secret is 12345")
    assert result == "<REDACTED>"

