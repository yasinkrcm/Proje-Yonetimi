const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'frontend', 'src');

function splitActions(actionsFilePath, dataFilePath) {
  const code = fs.readFileSync(actionsFilePath, 'utf8');
  const lines = code.split('\n');

  let actionsLines = [];
  let dataLines = [];

  // Remove "use server" for data file
  dataLines.push('import { apiFetch } from "@/lib/api-client";');
  dataLines.push('import { z } from "zod";');
  dataLines.push('import type { ActionResult } from "@/app/actions";');

  // Need to gather all imports for data.ts
  const importLines = lines.filter(l => l.startsWith('import ') && !l.includes('"use server"'));
  dataLines.push(...importLines.filter(l => !l.includes('revalidatePath') && !l.includes('revalidateTag')));

  let inDataFunction = false;
  let braces = 0;
  
  // A simple regex to detect GET functions
  const getFunctionRegex = /^export async function (get|search)[A-Za-z0-9_]+\(/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inDataFunction && getFunctionRegex.test(line)) {
      inDataFunction = true;
      braces = 0;
    }

    if (inDataFunction) {
      dataLines.push(line);
      braces += (line.match(/\{/g) || []).length;
      braces -= (line.match(/\}/g) || []).length;

      if (braces === 0 && line.includes('}')) {
        inDataFunction = false;
        dataLines.push('');
      }
    } else {
      if (!line.startsWith('import ') && !line.startsWith('"use server"')) {
        actionsLines.push(line);
      }
    }
  }

  // Preserve use server and imports for actions
  const finalActions = ['"use server";\n', ...importLines, ...actionsLines].join('\n');
  const finalData = dataLines.join('\n');

  fs.writeFileSync(actionsFilePath, finalActions);
  fs.writeFileSync(dataFilePath, finalData);
}

splitActions(
  path.join(root, 'app', 'actions.ts'),
  path.join(root, 'app', 'data.ts')
);

splitActions(
  path.join(root, 'app', '(dashboard)', 'actions.ts'),
  path.join(root, 'app', '(dashboard)', 'data.ts')
);

// Now update imports in ALL tsx files
function updateImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      if (fullPath.includes('actions.ts') || fullPath.includes('data.ts')) continue;
      
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // regex to match import { ... } from "@/app/actions" or "@/app/(dashboard)/actions"
      const importRegex = /import\s+\{([^}]+)\}\s+from\s+["'](@\/app\/(?:\(dashboard\)\/)?actions)["']/g;
      
      content = content.replace(importRegex, (match, importsStr, modulePath) => {
        const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
        const actionImports = [];
        const dataImports = [];
        
        for (const imp of imports) {
          if (imp.startsWith('get') || imp.startsWith('search')) {
            dataImports.push(imp);
          } else {
            actionImports.push(imp);
          }
        }
        
        let newImports = [];
        if (actionImports.length > 0) {
          newImports.push(`import { ${actionImports.join(', ')} } from "${modulePath}";`);
        }
        if (dataImports.length > 0) {
          const dataModulePath = modulePath.replace('actions', 'data');
          newImports.push(`import { ${dataImports.join(', ')} } from "${dataModulePath}";`);
        }
        
        if (actionImports.length || dataImports.length) {
          changed = true;
          return newImports.join('\n');
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

updateImports(root);
console.log("Refactoring complete");
