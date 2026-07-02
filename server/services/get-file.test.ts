import { afterAll, afterEach, describe, expect, it, mock, beforeEach } from 'bun:test';
import * as mockDataModule from '../github/mock-data';
import { getRepoFileContent } from './get-file';

const mockGetContent = mock(async () => ({
  data: {
    type: 'file',
    content: Buffer.from('hello world').toString('base64'),
  },
}));

function setupModuleMocks() {
  mock.module('../github/client', () => ({
    getOctokit: () => ({
      repos: {
        getContent: mockGetContent,
      },
    }),
    handleOctokitError: (err: any) => {
      throw err;
    },
  }));

  mock.module('../github/fetch-tree', () => ({
    fetchRepoInfo: async () => ({
      sha: 'test-sha',
    }),
  }));

  mock.module('../github/mock-data', () => ({
    isMockRepo: (owner: string) => owner === 'mock-owner',
    fetchMockFileContents: async (owner: string, repo: string, paths: string[]) => ({
      [paths[0]]: 'mock file content',
    }),
  }));
}

describe('services/get-file', () => {
  beforeEach(() => {
    setupModuleMocks();
    mockGetContent.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  afterAll(() => {
    mock.module('../github/mock-data', () => ({ ...mockDataModule }));
  });

  it('fetches mock file content when owner is mock-owner', async () => {
    const res = await getRepoFileContent('mock-owner', 'repo', 'src/main.ts');
    expect(res).toEqual({
      path: 'src/main.ts',
      content: 'mock file content',
      sha: 'test-sha',
    });
    expect(mockGetContent).not.toHaveBeenCalled();
  });

  it('fetches real file content from github when owner is not mock', async () => {
    const res = await getRepoFileContent('real-owner', 'repo', 'src/main.ts');
    expect(res).toEqual({
      path: 'src/main.ts',
      content: 'hello world',
      sha: 'test-sha',
    });
    expect(mockGetContent).toHaveBeenCalled();
  });

  it('throws error when file is not found in mock repo', async () => {
    mock.module('../github/mock-data', () => ({
      isMockRepo: (owner: string) => owner === 'mock-owner',
      fetchMockFileContents: async () => ({}),
    }));

    expect(getRepoFileContent('mock-owner', 'repo', 'nonexistent.ts')).rejects.toThrow('File not found: nonexistent.ts');
  });

  it('throws error when file is not found in github repo (404 status)', async () => {
    // Restore basic mock data module first
    mock.module('../github/mock-data', () => ({
      isMockRepo: (owner: string) => owner === 'mock-owner',
      fetchMockFileContents: async (owner: string, repo: string, paths: string[]) => ({
        [paths[0]]: 'mock file content',
      }),
    }));

    mockGetContent.mockImplementationOnce(async () => {
      throw { status: 404 };
    });

    expect(getRepoFileContent('real-owner', 'repo', 'nonexistent.ts')).rejects.toThrow('File not found: nonexistent.ts');
  });

  it('throws error when file is not a regular file (e.g. is a directory)', async () => {
    // Restore basic mock data module first
    mock.module('../github/mock-data', () => ({
      isMockRepo: (owner: string) => owner === 'mock-owner',
      fetchMockFileContents: async (owner: string, repo: string, paths: string[]) => ({
        [paths[0]]: 'mock file content',
      }),
    }));

    mockGetContent.mockImplementationOnce(async () => ({
      data: {
        type: 'dir',
      },
    }));

    expect(getRepoFileContent('real-owner', 'repo', 'src/folder')).rejects.toThrow('File is not a regular file or too large to display.');
  });

  it('delegates other API errors to handleOctokitError', async () => {
    mockGetContent.mockImplementationOnce(async () => {
      throw new Error('500 internal server error');
    });

    expect(getRepoFileContent('real-owner', 'repo', 'src/main.ts')).rejects.toThrow('500 internal server error');
  });
});
