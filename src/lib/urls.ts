// BASE_URL is '/' locally and the repository path on GitHub project Pages.
export function sitePath(path: string) {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
