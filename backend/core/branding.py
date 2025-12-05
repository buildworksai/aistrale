"""Branding helper functions for AISTRALE.

All branding values should be retrieved using these helper functions
to ensure consistency across the application.
"""
import os


def get_company_name() -> str:
    """Get company name using environment variables."""
    return os.getenv('COMPANY_NAME', 'BuildWorks.AI')


def get_product_name() -> str:
    """Get product name using environment variables."""
    return os.getenv('PRODUCT_NAME', 'AISTRALE')


def get_product_tagline() -> str:
    """Get product tagline using environment variables."""
    return os.getenv(
        'PRODUCT_TAGLINE',
        'Turn AI from a black box into an engineered system'
    )


def get_full_product_name() -> str:
    """Get full product name using environment variables."""
    return os.getenv(
        'FULL_PRODUCT_NAME',
        'AISTRALE - Turn AI from a black box into an engineered system'
    )


def get_footer_text() -> str:
    """Get footer text using environment variables."""
    return os.getenv('FOOTER_TEXT', 'AISTRALE Build by Buildworks.AI')


def get_website_url() -> str:
    """Get website URL using environment variables."""
    return os.getenv('WEBSITE_URL', 'https://aistrale.com')


def get_repo_url() -> str:
    """Get repository URL using environment variables."""
    owner = os.getenv('REPO_OWNER', 'buildworksai')
    name = os.getenv('REPO_NAME', 'aistrale')
    return f"https://github.com/{owner}/{name}.git"


def get_domain_urls() -> dict:
    """Get domain URLs using environment variables."""
    return {
        'production': os.getenv('PROD_DOMAIN', 'aistrale.com'),
        'staging': os.getenv('STAGING_DOMAIN', 'staging.aistrale.com'),
        'api': os.getenv('API_DOMAIN', 'api.aistrale.com')
    }

