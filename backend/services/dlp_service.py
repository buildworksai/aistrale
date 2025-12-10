import logging
import re
from typing import List, Tuple
from models.dlp_rule import DLPRule, DLPAction
from services.pii_detection_service import PIIDetectionService

logger = logging.getLogger(__name__)

class DLPService:
    """
    Data Loss Prevention Service.
    Combines PII detection with custom regex rules to permit/block/redact content.
    """

    def __init__(self, pii_service: PIIDetectionService):
        self.pii_service = pii_service
        # In real app, load from DB
        self.rules: List[DLPRule] = [
            DLPRule(name="Block Auth Tokens", pattern=r"(sk-[a-zA-Z0-9]{20,})", action=DLPAction.BLOCK, priority=100),
            DLPRule(name="Redact Internal IPs", pattern=r"(10\.\d{1,3}\.\d{1,3}\.\d{1,3})", action=DLPAction.REDACT, priority=50)
        ]

    def scan_content(self, text: str) -> Tuple[bool, str, List[str]]:
        """
        Scans content for violations.
        Returns: (is_blocked, processed_text, violation_messages)
        """
        if not text:
            return False, text, []

        violations = []
        is_blocked = False
        processed_text = text

        # 1. Check custom rules
        sorted_rules = sorted(self.rules, key=lambda r: r.priority, reverse=True)
        
        for rule in sorted_rules:
            if not rule.is_active:
                continue
                
            matches = re.finditer(rule.pattern, processed_text)
            found = False
            
            # Simple check if any match exists to flag action
            # For redaction, we need to substitute.
            if rule.action == DLPAction.BLOCK:
                if re.search(rule.pattern, processed_text):
                    is_blocked = True
                    violations.append(f"Blocked by rule: {rule.name}")
                    return True, text, violations # Immediate block

            elif rule.action == DLPAction.REDACT:
                if re.search(rule.pattern, processed_text):
                     # Replace with <REDACTED: RuleName>
                     processed_text = re.sub(rule.pattern, f"<REDACTED:{rule.name}>", processed_text)
                     violations.append(f"Redacted by rule: {rule.name}")

            elif rule.action == DLPAction.WARN:
                if re.search(rule.pattern, processed_text):
                    violations.append(f"Warning by rule: {rule.name}")

        # 2. Check PII (using existing service)
        # PII usually means redact or warn, rarely block entire request unless configured.
        # We will assume configured to REDACT PII for DLP purposes here.
        processed_text = self.pii_service.redact(processed_text)

        return is_blocked, processed_text, violations
