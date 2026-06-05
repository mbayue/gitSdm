import { getOctokit, handleOctokitError } from '../github/client';
import { fetchRepoInfo } from '../github/fetch-tree';
import { isMockRepo, fetchMockFileContents } from '../github/mock-data';

export async function getRepoFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  token?: string,
): Promise<{ path: string; content: string; sha: string }> {
  const info = await fetchRepoInfo(owner, repo, branch, token);

  if (isMockRepo(owner)) {
    const contents = await fetchMockFileContents(owner, repo, [path]);
    const content = contents[path];
    if (content === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return { path, content, sha: info.sha };
  }

  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: info.sha,
    });
    if (!Array.isArray(data) && data.type === 'file' && 'content' in data && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8').slice(0, 50000);
      return { path, content, sha: info.sha };
    }
    throw new Error('File is not a regular file or too large to display.');
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404) {
      throw new Error(`File not found: ${path}`);
    }
    handleOctokitError(error);
  }
}
