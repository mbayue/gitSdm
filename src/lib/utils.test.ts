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
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
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

    it('handles falsy values safely', () => {
      expect(cn('foo', null, undefined, false, 0, '')).toBe('foo');
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

    it('returns null for invalid inputs', () => {
      expect(parseRepoFromUrl('invalid-string')).toBeNull();
      expect(parseRepoFromUrl('https://google.com/facebook/react')).toBeNull();
    });
  });
});
