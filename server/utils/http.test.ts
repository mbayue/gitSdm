import { describe, it, expect } from 'bun:test';
import { addSecurityHeaders } from './http';

describe('addSecurityHeaders', () => {
  it('adds security headers to the response', () => {
    const response = new Response('ok');
    const secureResponse = addSecurityHeaders(response);

    expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
    expect(secureResponse.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect(secureResponse.headers.get('Content-Security-Policy')).toBe("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:;");
  });
});
