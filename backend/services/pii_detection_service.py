import logging
import re
from typing import List, Dict, Any, Optional

try:
    from presidio_analyzer import AnalyzerEngine, RecognizerResult
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig

    PRESIDIO_AVAILABLE = True
except ImportError:
    PRESIDIO_AVAILABLE = False
    AnalyzerEngine = None
    AnonymizerEngine = None
    RecognizerResult = None
    OperatorConfig = None

logger = logging.getLogger(__name__)


class PIIDetectionService:
    """
    Service for detecting and handling Personally Identifiable Information (PII) in text.
    Uses Microsoft Presidio for detection.
    Falls back to basic pattern matching if Presidio is not available.
    """

    def __init__(self, languages: List[str] = ["en"]):
        self.languages = languages
        self.analyzer = None
        self.anonymizer = None

        if not PRESIDIO_AVAILABLE:
            logger.warning(
                "Presidio not available. PII detection will use basic pattern matching."
            )
            return

        try:
            # Try to initialize Presidio, but don't fail if spacy model is
            # missing
            try:
                self.analyzer = AnalyzerEngine(default_score_threshold=0.5)
                self.anonymizer = AnonymizerEngine()
                logger.info("PIIDetectionService initialized with Presidio")
            except Exception as e:
                logger.warning(
                    f"Presidio initialization failed: {e}. Using basic pattern matching."
                )
                self.analyzer = None
                self.anonymizer = None
        except Exception as e:
            logger.warning(
                f"Failed to initialize PIIDetectionService with Presidio: {e}. Using basic pattern matching."
            )

    def analyze(self, text: str) -> List:
        """
        Analyze text to find PII entities.
        Falls back to basic pattern matching if Presidio is not available.
        """
        if not text:
            return []

        if not self.analyzer:
            # Basic pattern matching fallback
            return self._basic_pii_detection(text)

        try:
            results = self.analyzer.analyze(
                text=text, entities=[], language="en")
            return results
        except Exception as e:
            logger.error(f"Error analyzing text for PII: {e}")
            return self._basic_pii_detection(text)

    def _basic_pii_detection(self, text: str) -> List:
        """Basic PII detection using regex patterns."""
        patterns = {
            "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "PHONE": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
            "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
        }
        results = []
        for entity_type, pattern in patterns.items():
            for match in re.finditer(pattern, text):
                # Create a simple result object
                result = type(
                    "Result",
                    (),
                    {
                        "entity_type": entity_type,
                        "start": match.start(),
                        "end": match.end(),
                        "score": 0.8,
                    },
                )()
                results.append(result)
        return results

    def anonymize(self, text: str,
                  operators: Optional[Dict[str, Any]] = None) -> str:
        """
        Anonymize PII in text using detected entities.
        Default behavior is to replace with <ENTITY_TYPE>.
        Falls back to basic redaction if Presidio is not available.
        """
        if not text:
            return ""

        if not self.anonymizer:
            # Basic redaction fallback
            return self._basic_redaction(text)

        try:
            results = self.analyze(text)
            if not results:
                return text
            anonymized_result = self.anonymizer.anonymize(
                text=text, analyzer_results=results, operators=operators
            )
            return anonymized_result.text
        except Exception as e:
            logger.error(f"Error anonymizing text: {e}, using basic redaction")
            return self._basic_redaction(text)

    def _basic_redaction(self, text: str) -> str:
        """Basic PII redaction using regex patterns."""
        patterns = {
            "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "PHONE": r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",
            "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
        }
        redacted = text
        for entity_type, pattern in patterns.items():
            redacted = re.sub(pattern, f"<REDACTED:{entity_type}>", redacted)
        return redacted

    def redact(self, text: str) -> str:
        """
        Helper to simple redaction.
        """
        return self.anonymize(text)
