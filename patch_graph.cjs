const fs = require('fs');
const content = fs.readFileSync('server/graph/graph-builder.ts', 'utf8');

const target1 = `  const allFilePaths = fileNodes.map((n) => n.id.replace(/^file:/, ''));`;
const replacement1 = `  const allFilePaths = fileNodes.map((n) => n.id.replace(/^file:/, ''));

  const sortedWorkspacePackages = [...workspacePackages].sort((a, b) => b.rootPath.length - a.rootPath.length);`;

let newContent = content.replace(target1, replacement1);

const target2 = `  for (const path of allFilePaths) {
    const ownerPackage = findWorkspacePackageForPath(path, workspacePackages);`;
const replacement2 = `  for (const path of allFilePaths) {
    const ownerPackage = findWorkspacePackageForPath(path, sortedWorkspacePackages);`;

newContent = newContent.replace(target2, replacement2);

fs.writeFileSync('server/graph/graph-builder.ts', newContent);
console.log('patched graph-builder.ts');
