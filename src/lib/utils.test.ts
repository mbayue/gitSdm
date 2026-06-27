import { describe, expect, it } from 'bun:test';
import { cn, formatStars, parseRepoFromUrl } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('resolves tailwind conflicts', () => {
      // twMerge should override the first text-color class with the second
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
      const isTrue = true;
      const isFalse = false;
      expect(cn('foo', isTrue && 'bar', isFalse && 'baz')).toBe('foo bar');
    });

    it('handles arrays of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
      expect(cn(['foo', { bar: true }])).toBe('foo bar');
    });

    it('handles complex combinations', () => {
      expect(
        cn(
          'base-class',
          { 'is-active': true },
          ['array-class', { 'array-nested': true }],
          'text-red-500 p-2',
          'p-4'
        )
      ).toBe('base-class is-active array-class array-nested text-red-500 p-4');
    });

    it('resolves complex tailwind conflicts', () => {
      expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
      expect(cn('text-lg text-sm text-center')).toBe('text-sm text-center');
      expect(cn('bg-red-500', { 'bg-blue-500': true })).toBe('bg-blue-500');
      expect(cn(['text-black', 'text-white'], { 'font-bold': true })).toBe('text-white font-bold');
      expect(cn(['p-2', 'm-2'], ['p-4', 'm-4'])).toBe('p-4 m-4');
      expect(cn({ 'text-red-500': false, 'text-blue-500': true }, 'text-green-500')).toBe('text-green-500');
    });

    it('handles falsy values safely', () => {
      expect(cn('foo', null, undefined, false, 0, '')).toBe('foo');
      expect(cn(undefined, null, false, '', 0, 'text-center')).toBe('text-center');
    });
  });

  describe('formatStars', () => {
    it('formats stars less than 1,000', () => {
      expect(formatStars(0)).toBe('0');
      expect(formatStars(999)).toBe('999');
    });

    it('formats stars in thousands', () => {
      expect(formatStars(1000)).toBe('1.0k');
      expect(formatStars(1500)).toBe('1.5k');
      expect(formatStars(999900)).toBe('999.9k');
    });

    it('formats stars in millions', () => {
      expect(formatStars(1000000)).toBe('1.0M');
      expect(formatStars(1500000)).toBe('1.5M');
      expect(formatStars(2000000)).toBe('2.0M');
    });
  });

  describe('parseRepoFromUrl', () => {
    it('parses "owner/repo" string', () => {
      expect(parseRepoFromUrl('facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('parses GitHub URLs', () => {
      expect(parseRepoFromUrl('https://github.com/facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('http://github.com/facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('github.com/facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles trailing slashes', () => {
      expect(parseRepoFromUrl('facebook/react/')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('https://github.com/facebook/react/')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles .git suffix', () => {
      expect(parseRepoFromUrl('facebook/react.git')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('https://github.com/facebook/react.git')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles URLs with query parameters', () => {
      expect(parseRepoFromUrl('https://github.com/facebook/react?tab=readme-ov-file')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles URLs with hash parameters', () => {
      expect(parseRepoFromUrl('https://github.com/facebook/react#readme')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles deep links (e.g., issues, pull requests)', () => {
      expect(parseRepoFromUrl('https://github.com/facebook/react/issues/1')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('https://github.com/facebook/react/pull/123')).toEqual({ owner: 'facebook', repo: 'react' });
      expect(parseRepoFromUrl('github.com/facebook/react/tree/main/src')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles subdomains (e.g., www)', () => {
      expect(parseRepoFromUrl('https://www.github.com/facebook/react')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles .git/ trailing slash edge case', () => {
      expect(parseRepoFromUrl('facebook/react.git/')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('handles SSH URLs', () => {
      expect(parseRepoFromUrl('git@github.com:facebook/react.git')).toEqual({ owner: 'facebook', repo: 'react' });
    });

    it('returns null for invalid inputs', () => {
      expect(parseRepoFromUrl('invalid-string')).toBeNull();
      expect(parseRepoFromUrl('https://google.com/facebook/react')).toBeNull();
    });
  });
});
