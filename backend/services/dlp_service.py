"""Data Loss Prevention service."""

import logging
import re

from sqlmodel import Session, select

from models.dlp_rule import DLPAction, DLPRule
from services.pii_detection_service import PIIDetectionService

logger = logging.getLogger(__name__)


class DLPService:
    """
    Data Loss Prevention Service.
    Combines PII detection with custom regex rules to permit/block/redact content.
    """

    def __init__(self, pii_service: PIIDetectionService,
                 session: Session | None = None):
        self.pii_service = pii_service
        self.session = session
        self._rules_cache: list[DLPRule] | None = None

    def _load_rules(self) -> list[DLPRule]:
        """Load DLP rules from database or use defaults."""
        if self._rules_cache is not None:
            return self._rules_cache

        if self.session:
            try:
                rules = self.session.exec(
                    select(DLPRule).where(DLPRule.is_active == True)  # noqa: E712
                ).all()
                if rules:
                    self._rules_cache = list(rules)
                    return self._rules_cache
            except Exception as e:
                logger.warning(f"Failed to load DLP rules from DB: {e}")

        # Default rules if DB not available
        default_rules = [
            DLPRule(
                name="Block Auth Tokens",
                pattern=r"(sk-[a-zA-Z0-9]{20,})",
                action=DLPAction.BLOCK,
                priority=100,
            ),
            DLPRule(
                name="Redact Internal IPs",
                pattern=r"(10\.\d{1,3}\.\d{1,3}\.\d{1,3})",
                action=DLPAction.REDACT,
                priority=50,
            ),
        ]
        self._rules_cache = default_rules
        return default_rules

    def invalidate_cache(self):
        """Invalidate the rules cache."""
        self._rules_cache = None

    def scan_content(self, text: str) -> tuple[bool, str, list[str]]:
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
        rules = self._load_rules()
        sorted_rules = sorted(rules, key=lambda r: r.priority, reverse=True)

        for rule in sorted_rules:
            if not rule.is_active:
                continue

            # Simple check if any match exists to flag action
            # For redaction, we need to substitute.
            if rule.action == DLPAction.BLOCK:
                if re.search(rule.pattern, processed_text):
                    is_blocked = True
                    violations.append(f"Blocked by rule: {rule.name}")
                    return True, text, violations  # Immediate block

            elif rule.action == DLPAction.REDACT:
                if re.search(rule.pattern, processed_text):
                    # Replace with <REDACTED: RuleName>
                    processed_text = re.sub(
                        rule.pattern, f"<REDACTED:{rule.name}>", processed_text
                    )
                    violations.append(f"Redacted by rule: {rule.name}")

            elif rule.action == DLPAction.WARN:
                if re.search(rule.pattern, processed_text):
                    violations.append(f"Warning by rule: {rule.name}")

        # 2. Check PII (using existing service)
        # PII usually means redact or warn, rarely block entire request unless
        # configured.
        # We will assume configured to REDACT PII for DLP purposes here.
        processed_text = self.pii_service.redact(processed_text)

        return is_blocked, processed_text, violations
