---
trigger: always_on
description: UI terminology, branding and visual identity standards for AISTRALE application
globs: frontend/**/*.{ts,tsx,css,scss}
---

# 🎨 UI Terminology, Branding & Visual Identity

**⚠️ CRITICAL**: All branding elements are defined here. Other files MUST reference these variables, not hardcode branding values.

## BuildWorks-11000 Central Branding Registry (SINGLE SOURCE OF TRUTH)

### Environment Variables for Branding
```bash
# Company & Product Names
COMPANY_NAME="BuildWorks.AI"
PRODUCT_NAME="AISTRALE"
PRODUCT_TAGLINE="Turn AI from a black box into an engineered system"
FULL_PRODUCT_NAME="AISTRALE - Turn AI from a black box into an engineered system"
SHORT_NAME="AISTRALE"
FOOTER_TEXT="AISTRALE Build by Buildworks.AI"

# Website
WEBSITE_URL="https://aistrale.com"

# Repository Information
REPO_OWNER="buildworksai"
REPO_NAME="aistrale"
REPO_URL="https://github.com/buildworksai/aistrale.git"

# Domain Configuration
PROD_DOMAIN="aistrale.com"
STAGING_DOMAIN="staging.aistrale.com"
API_DOMAIN="api.aistrale.com"
```

### Python Helper Functions
```python
# backend/core/branding.py
import os

def get_company_name() -> str:
    """Get company name using environment variables"""
    return os.getenv('COMPANY_NAME', 'BuildWorks.AI')

def get_product_name() -> str:
    """Get product name using environment variables"""
    return os.getenv('PRODUCT_NAME', 'AISTRALE')

def get_product_tagline() -> str:
    """Get product tagline using environment variables"""
    return os.getenv('PRODUCT_TAGLINE', 'Turn AI from a black box into an engineered system')

def get_full_product_name() -> str:
    """Get full product name using environment variables"""
    return os.getenv('FULL_PRODUCT_NAME', 'AISTRALE - Turn AI from a black box into an engineered system')

def get_footer_text() -> str:
    """Get footer text using environment variables"""
    return os.getenv('FOOTER_TEXT', 'AISTRALE Build by Buildworks.AI')

def get_website_url() -> str:
    """Get website URL using environment variables"""
    return os.getenv('WEBSITE_URL', 'https://aistrale.com')

def get_repo_url() -> str:
    """Get repository URL using environment variables"""
    owner = os.getenv('REPO_OWNER', 'buildworksai')
    name = os.getenv('REPO_NAME', 'aistrale')
    return f"https://github.com/{owner}/{name}.git"

def get_domain_urls() -> dict:
    """Get domain URLs using environment variables"""
    return {
        'production': os.getenv('PROD_DOMAIN', 'aistrale.com'),
        'staging': os.getenv('STAGING_DOMAIN', 'staging.aistrale.com'),
        'api': os.getenv('API_DOMAIN', 'api.aistrale.com')
    }
```

### TypeScript Helper Functions
```typescript
// frontend/src/lib/branding.ts
export const getBranding = () => {
  return {
    companyName: import.meta.env.VITE_COMPANY_NAME || 'BuildWorks.AI',
    productName: import.meta.env.VITE_PRODUCT_NAME || 'AISTRALE',
    productTagline: import.meta.env.VITE_PRODUCT_TAGLINE || 'Turn AI from a black box into an engineered system',
    fullProductName: import.meta.env.VITE_FULL_PRODUCT_NAME || 'AISTRALE - Turn AI from a black box into an engineered system',
    websiteUrl: import.meta.env.VITE_WEBSITE_URL || 'https://aistrale.com',
    repoUrl: import.meta.env.VITE_REPO_URL || 'https://github.com/buildworksai/aistrale.git',
    domains: {
      production: import.meta.env.VITE_PROD_DOMAIN || 'aistrale.com',
      staging: import.meta.env.VITE_STAGING_DOMAIN || 'staging.aistrale.com',
      api: import.meta.env.VITE_API_DOMAIN || 'api.aistrale.com'
    }
  };
};

export const getFooterText = () => {
  return import.meta.env.VITE_FOOTER_TEXT || 'AISTRALE Build by Buildworks.AI';
};
```

## BuildWorks-11001 Platform Naming
- Must be referred to as "AISTRALE" or "AISTRALE - Turn AI from a black box into an engineered system" in code comments, UI, docs, logs.
- Use `get_full_product_name()` helper function for consistency.
- Company name "BuildWorks.AI" should be used only in footer and attribution contexts.

## BuildWorks.AI-11002 UI Terminology Standards
- **No internal jargon** in user-facing text
- **Consistency**: use the same term for the same concept
- **Clarity**: short, unambiguous labels
- **Accessibility**: ARIA labels describe purpose, not appearance

### Examples:
- Use "Sign in" or "Log in" consistently across UI
- Use "Workspace" vs "Project" per product naming decisions
- Use "Tenant" vs "Organization" consistently for multi-tenant concepts

## BuildWorks.AI-11003 Semantic Color Palette (hex + theme mapping)
- Deep Blue: `#1565C0` (primary.main), `#0D47A1` (primary.dark)
- Gold: `#FF8F00` (warning.main), `#F57C00` (warning.dark)
- Teal/Electric Blue: `#00ACC1` (info.main), `#0097A7` (info.dark)
- Green: `#388E3C` (success.main), `#2E7D32` (success.dark)

## BuildWorks.AI-11004 Component Color Enforcement
```tsx
<AppBar sx={{ bgcolor: 'primary.main' }} />
<Chip label="Enterprise" color="warning" />
<Button variant="contained" color="info" />
<Alert severity="success" />
```
- No hardcoded hex in components; use theme tokens.

## BuildWorks.AI-11005 Toast Notifications
- Include timeout indicator (progress bar)
- Durations: 6s info, 8s warnings/errors
- Dismissible with proper ARIA

## BuildWorks-11006 Footer Standards
- Include the below footer in all UI Pages using helper function
- Footer text: "AISTRALE Build by Buildworks.AI"
```tsx
import { getFooterText } from '@/lib/branding';

{/* Dynamic Footer using branding registry */}
<div className="mt-12 text-center border-t border-gray-200 dark:border-gray-700 pt-6">
  <p className="text-sm text-gray-500 dark:text-gray-400">
    {getFooterText()}
  </p>
</div>
```

## BuildWorks-11007 License Information
- **License**: Apache License 2.0
- All source files must include Apache 2.0 license header
- See LICENSE file in project root for full license text

## BuildWorks-11008 Files That Reference This Central Registry
- `02-rule-registry.mdc` - References branding variables
- `21-deployment-devops.mdc` - Uses domain URLs
- All frontend components - Use branding helper functions
- All documentation - Reference branding variables

## BuildWorks-11009 How to Change Branding
1. Update environment variables in this file
2. Update any hardcoded references to use helper functions
3. Test across all environments (dev/staging/prod)
4. Update documentation and README files
