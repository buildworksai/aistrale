export const getBranding = () => {
  return {
    companyName: import.meta.env.VITE_COMPANY_NAME || 'BuildWorks.AI',
    productName: import.meta.env.VITE_PRODUCT_NAME || 'AISTRALE',
    productTagline: import.meta.env.VITE_PRODUCT_TAGLINE || 'Turn AI from a black box into an engineered system',
    fullProductName: import.meta.env.VITE_FULL_PRODUCT_NAME || 'AISTRALE - Turn AI from a black box into an engineered system',
    websiteUrl: import.meta.env.VITE_WEBSITE_URL || 'https://aistrale.com',
    repoUrl: import.meta.env.VITE_REPO_URL || 'https://github.com/buildworksai/aistrale.git',
    footerText: import.meta.env.VITE_FOOTER_TEXT || 'AISTRALE Build by Buildworks.AI',
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
