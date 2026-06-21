import { describe, it, expect } from 'bun:test';
import { parseGitHubUrl, parseRepoParams } from './parse-url';

describe('parse-url', () => {
  describe('parseGitHubUrl', () => {
    it('parses standard https url', () => {
      const result = parseGitHubUrl('https://github.com/mbayue/gitSdm');
      expect(result).toEqual({ owner: 'mbayue', repo: 'gitSdm' });
    });

    it('parses url with .git extension', () => {
      const result = parseGitHubUrl('https://github.com/mbayue/gitSdm.git');
      expect(result).toEqual({ owner: 'mbayue', repo: 'gitSdm' });
    });

    it('parses owner/repo shorthand format', () => {
      const result = parseGitHubUrl('mbayue/gitSdm');
      expect(result).toEqual({ owner: 'mbayue', repo: 'gitSdm' });
    });

    it('returns null for invalid urls', () => {
      expect(parseGitHubUrl('https://google.com')).toBeNull();
      expect(parseGitHubUrl('not-a-repo')).toBeNull();
    });

    it('handles git trailing slashes safely', () => {
      const result = parseGitHubUrl('https://github.com/mbayue/gitSdm/');
      expect(result).toEqual({ owner: 'mbayue', repo: 'gitSdm' });
    });
  });

  describe('parseRepoParams', () => {
    it('uses owner and repo if provided', () => {
      const result = parseRepoParams('facebook', 'react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('falls back to url if owner and repo are missing', () => {
      const result = parseRepoParams(undefined, undefined, 'https://github.com/facebook/react');
      expect(result).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('returns empty fallback elements if missing parameters and URL is empty', () => {
      const result = parseRepoParams(undefined, undefined, '');
      expect(result).toBeNull();
    });
  });
});
