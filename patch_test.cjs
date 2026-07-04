const fs = require('fs');
const content = fs.readFileSync('server/parser/dependency-analyzer.test.ts', 'utf8');

const target = `    // When: ownership is resolved for a nested source file
    const owner = findWorkspacePackageForPath('packages/a/nested/src/index.ts', packages);`;

const replacement = `    // When: ownership is resolved for a nested source file
    // Note: findWorkspacePackageForPath expects packages to be pre-sorted by rootPath length descending
    const sortedPackages = [...packages].sort((a, b) => b.rootPath.length - a.rootPath.length);
    const owner = findWorkspacePackageForPath('packages/a/nested/src/index.ts', sortedPackages);`;

const newContent = content.replace(target, replacement);
fs.writeFileSync('server/parser/dependency-analyzer.test.ts', newContent);
console.log('patched dependency-analyzer.test.ts');
