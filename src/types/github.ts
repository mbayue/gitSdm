export interface GitHubTreeItem {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}
