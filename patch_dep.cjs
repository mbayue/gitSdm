const fs = require('fs');
const content = fs.readFileSync('server/parser/dependency-analyzer.ts', 'utf8');

const target = `export function findWorkspacePackageForPath(
  path: string,
  packages: readonly WorkspacePackage[],
): WorkspacePackage | undefined {
  return packages
    .filter((pkg) => pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(\`\${pkg.rootPath}/\`))
    .sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
}`;
const replacement = `export function findWorkspacePackageForPath(
  path: string,
  packages: readonly WorkspacePackage[],
): WorkspacePackage | undefined {
  return packages.find(
    (pkg) => pkg.rootPath === '' || path === pkg.rootPath || path.startsWith(\`\${pkg.rootPath}/\`),
  );
}`;

let newContent = content.replace(target, replacement);

fs.writeFileSync('server/parser/dependency-analyzer.ts', newContent);
console.log('patched dependency-analyzer.ts');
