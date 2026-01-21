/**
 * Utility functions for generating subdomain URLs
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const getDomainURLs = () => {
    if (isDevelopment) {
        return {
            base: 'http://localhost:3000',
            admin: 'http://localhost:3000/admin',
            app: 'http://localhost:3000/app',
            start: 'http://localhost:3000/start',
        };
    }

    return {
        base: `https://${process.env.NEXT_PUBLIC_DOMAIN}`,
        admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.getqard.com',
        app: process.env.NEXT_PUBLIC_APP_URL || 'https://app.getqard.com',
        start: process.env.NEXT_PUBLIC_START_URL || 'https://start.getqard.com',
    };
};

/**
 * Generate start URL for a customer (QR code link)
 */
export const getStartURL = (slug: string): string => {
    const urls = getDomainURLs();
    return isDevelopment
        ? `${urls.start}/${slug}`
        : `${urls.start}/${slug}`;
};

/**
 * Generate POS URL for a store (now on app subdomain)
 */
export const getPOSURL = (slug: string): string => {
    const urls = getDomainURLs();
    return isDevelopment
        ? `${urls.app}/${slug}`
        : `${urls.app}/${slug}`;
};

/**
 * Generate pass download URL
 */
export const getPassURL = (passId: string): string => {
    const urls = getDomainURLs();
    return `${urls.base}/p/${passId}`;
};

/**
 * Generate admin URL (for internal agentur use)
 */
export const getAdminURL = (path?: string): string => {
    const urls = getDomainURLs();
    return path ? `${urls.admin}${path}` : urls.admin;
};

/**
 * Generate dynamic QR code URL (permanent, redirectable)
 */
export const getDynamicQRURL = (code: string): string => {
    const urls = getDomainURLs();
    return `${urls.start}/d/${code}`;
};
