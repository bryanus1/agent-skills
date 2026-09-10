#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function printHelp() {
  console.log(`
Usage: node scaffold-component.mjs <component-name> [options]

Arguments:
  component-name      Name of component in kebab-case (e.g., user-card, invoice-form-dialog)

Options:
  --target-dir <dir>  Target directory (default: src/components/common)
  --type <type>       Component archetype: 'default', 'dialog', 'section' (default: default)
  --help, -h          Show this help message
`);
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const componentName = args[0];
  if (!/^[a-z0-9-]+$/.test(componentName)) {
    console.error(`❌ Error: Component name '${componentName}' must be in kebab-case.`);
    process.exit(1);
  }

  let targetDir = 'src/components/common';
  let componentType = 'default';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--target-dir' && args[i + 1]) {
      targetDir = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      componentType = args[i + 1];
      i++;
    }
  }

  const pascalName = toPascalCase(componentName);
  const componentFolder = path.resolve(process.cwd(), targetDir, componentName);

  if (fs.existsSync(componentFolder)) {
    console.error(`❌ Error: Folder already exists at '${componentFolder}'`);
    process.exit(1);
  }

  fs.mkdirSync(componentFolder, { recursive: true });

  const componentFile = path.join(componentFolder, `${componentName}.tsx`);
  const testFile = path.join(componentFolder, `${componentName}.test.tsx`);
  const indexFile = path.join(componentFolder, 'index.ts');

  let componentCode = '';
  let testCode = '';

  if (componentType === 'dialog') {
    componentCode = `import React from 'react';
import { FormDialog } from '@/components/common/form-dialog';

/**
 * Props for {@link ${pascalName}}.
 */
export interface I${pascalName}Props {
  /** Controls open visibility state in controlled mode. */
  readonly open?: boolean;
  /** Callback fired when dialog open state changes. */
  readonly onOpenChange?: (open: boolean) => void;
  /** Optional trigger element. Pass null when controlled externally. */
  readonly trigger?: React.ReactNode | null;
  /** Callback fired after successfully submitting the form. */
  readonly onSuccess?: () => void;
}

/**
 * Form dialog modal for managing ${pascalName.replace(/FormDialog$/, '')} entity.
 */
export function ${pascalName}({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}: Readonly<I${pascalName}Props>): React.JSX.Element {
  return (
    <FormDialog
      title="${pascalName.replace(/FormDialog$/, '')}"
      description="Completa el siguiente formulario para continuar."
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSuccess?.();
        }}
        className="space-y-4 py-2"
      >
        {/* TODO: Add encapsulated form fields or presentational sub-form */}
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={() => onOpenChange?.(false)} className="px-4 py-2 text-sm border rounded-md">
            Cancelar
          </button>
          <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">
            Guardar
          </button>
        </div>
      </form>
    </FormDialog>
  );
}
`;

    testCode = `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ${pascalName} } from './${componentName}';

describe('${pascalName} Component', () => {
  it('renders dialog and handles submission', () => {
    const handleSuccess = jest.fn();
    render(<${pascalName} open={true} onSuccess={handleSuccess} />);

    expect(screen.getByText('${pascalName.replace(/FormDialog$/, '')}')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Guardar'));
    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });
});
`;
  } else {
    componentCode = `import React from 'react';

/**
 * Props for {@link ${pascalName}}.
 */
export interface I${pascalName}Props {
  /** Optional CSS class name override. */
  readonly className?: string;
  /** Main content or children. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascalName} component.
 *
 * @param props - Component configuration defined in {@link I${pascalName}Props}.
 * @returns Rendered JSX element.
 */
export function ${pascalName}({
  className,
  children,
}: Readonly<I${pascalName}Props>): React.JSX.Element {
  return (
    <div className={className}>
      {children || <span>${pascalName}</span>}
    </div>
  );
}
`;

    testCode = `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${pascalName} } from './${componentName}';

describe('${pascalName} Component', () => {
  it('renders default content correctly', () => {
    render(<${pascalName} />);
    expect(screen.getByText('${pascalName}')).toBeInTheDocument();
  });

  it('renders children when passed', () => {
    render(<${pascalName}><span>Child Content</span></${pascalName}>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
`;
  }

  const indexCode = `export * from './${componentName}';\n`;

  fs.writeFileSync(componentFile, componentCode, 'utf8');
  fs.writeFileSync(testFile, testCode, 'utf8');
  fs.writeFileSync(indexFile, indexCode, 'utf8');

  console.log(`✅ Component '${pascalName}' created at:`);
  console.log(`   - ${path.relative(process.cwd(), componentFile)}`);
  console.log(`   - ${path.relative(process.cwd(), testFile)}`);
  console.log(`   - ${path.relative(process.cwd(), indexFile)}`);
}

main();
