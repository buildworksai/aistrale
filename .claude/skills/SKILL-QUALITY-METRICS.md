# Skill Quality Metrics & Enforcement

**SPDX-License-Identifier: Apache-2.0**

**Purpose:** Prevent regression to placeholder-driven skill creation
**Enforcement:** Automated validation + manual review
**Last Updated:** 2025-01-27
**Product:** AISTRALE - Turn AI from a black box into an engineered system

---

## Quality Gates

Every skill must pass **ALL** gates before inclusion.

### Gate 1: Implementation Validation 🔴 CRITICAL

| Check | Requirement | Validation Method |
|-------|-------------|-------------------|
| **No Empty Blocks** | Zero bash blocks with no commands | `grep -A 1 '```bash' SKILL.md` |
| **No Fake References** | No comments pretending to be commands | Regex: `^# (Use\|Run\|Execute)` in bash blocks |
| **Working Documentation** | Documentation is accurate and useful | Manual review |

**Failure = Immediate Rejection**

### Gate 2: Documentation Specificity 🟡 HIGH PRIORITY

| Check | Requirement | Validation Method |
|-------|-------------|-------------------|
| **No Placeholders** | Zero "Scenario 1", "Benefit 1", "Tool 1: Purpose" text | Regex match |
| **Concrete Examples** | All examples show actual commands with real paths | Manual review |
| **Expected Output** | Document what success looks like | Section exists |
| **One-Sentence Purpose** | Clear, specific purpose statement | Character count <150 |

**Failure = Major Revision Required**

### Gate 3: Content Density ⚠️ MEDIUM PRIORITY

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Useful Content Ratio** | >80% | Lines with substance / Total lines |
| **Generic Boilerplate** | 0 lines | Detect copy-paste best practices |
| **Total Line Count** | <200 lines | `wc -l SKILL.md` |
| **Unique Content** | >70% | Compare with other SKILL.md files |

**Failure = Revision Required**

### Gate 4: Maintenance Status ⚠️ MEDIUM PRIORITY

| Check | Requirement | Validation Method |
|-------|-------------|-------------------|
| **Last Validated Date** | Within 90 days | Parse date from SKILL.md |
| **Working Status** | Clearly marked (✅/🔴) | Status indicator present |
| **README Updated** | Skill listed in main README | Grep check |

**Failure = Warning, Update Required**

---

## Quality Metrics Dashboard

### Current State

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Skills** | 5 | 5-10 | ✅ Good |
| **Working Rate** | 100% | 100% | ✅ Excellent |
| **Gate 1 Pass Rate** | 100% | 100% | ✅ Excellent |
| **Gate 2 Pass Rate** | 100% | 100% | ✅ Excellent |
| **Gate 3 Pass Rate** | 100% | >90% | ✅ Excellent |
| **Gate 4 Pass Rate** | 100% | >80% | ✅ Excellent |
| **Avg Useful Content** | 90% | >80% | ✅ Excellent |
| **Avg Lines per Skill** | 150 | <200 | ✅ Good |
| **Context Efficiency** | High | High | ✅ Excellent |

**Last Measured:** 2025-01-27

---

## Red Flags: Instant Rejection Criteria

If ANY of these appear in a skill, **REJECT IMMEDIATELY**:

### 🚩 Implementation Red Flags

```bash
# ❌ Empty bash block
```bash
```

# ❌ Comment pretending to be command
```bash
# Use the analyzer script
```

# ❌ Non-existent script reference
See `scripts/tool_that_doesnt_exist.py`

# ❌ TODO in production skill
TODO: Implement this feature
```

### 🚩 Documentation Red Flags

```markdown
❌ Detailed explanation of the pattern.
❌ Scenario 1, Scenario 2, Scenario 3
❌ Benefit 1, Benefit 2, Benefit 3
❌ Tool 1: Purpose, Tool 2: Purpose
❌ Implementation details
❌ Code here
```

### 🚩 Content Red Flags

```markdown
❌ Generic "Best Practices" section with:
   - Follow established patterns
   - Write comprehensive tests
   - Document decisions

❌ Copy-paste boilerplate:
   - "Automated scaffolding"
   - "Best practices built-in"
   - "Configurable templates"
   - "Quality checks"

❌ Vague promises:
   - "Comprehensive analysis"
   - "Deep insights"
   - "Automated fixes"
```

---

## Success Patterns

### Example: Good Skill Structure

```markdown
---
name: skill-name
description: Clear one-sentence purpose
status: ✅ Working
last-validated: 2025-01-27
---

# Skill Name

## Purpose

One sentence, specific.

## Requirements

What must be installed/configured.

## Usage

Actual commands that work.

## Expected Output

What success looks like.

## Troubleshooting

Common failures and fixes.

## Maintenance

- **Last Validated:** 2025-01-27
- **Status:** ✅ Working
- **Update Frequency:** As needed
```

**Why This Works:**
- Clear purpose (1 sentence)
- Real requirements listed
- Actual executable command
- Expected output shown
- Troubleshooting included
- Maintenance status documented
- Zero placeholders
- Zero generic filler

---

**Last Updated:** 2025-01-27
**Next Review:** 2025-04-27
**Status:** Active Enforcement

