import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/dashboard', '/startup-dashboard', '/profile', '/notifications', '/edit-startup/', '/competition/dashboard', '/competition/login', '/competition/idea-submission', '/competition/submit-idea'],
      },
    ],
    sitemap: 'https://www.vishvakarmahub.com/sitemap.xml',
  };
}
