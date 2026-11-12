// File templates for the nextjs-architecture scaffolds (Next.js App Router + Vitest).

export function modelTemplate(pascal) {
  return `/**
 * Domain model representing ${pascal}.
 */
export interface I${pascal} {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  // TODO: Add domain properties here
}
`;
}

export const barrel = (name) => `export * from './${name}';\n`;

export function screenTemplate(pascal, name) {
  return `import React from 'react';

/**
 * Props for {@link ${pascal}Home}.
 */
export interface I${pascal}HomeProps {
  readonly title?: string;
}

/**
 * Main dashboard screen for the ${pascal} feature.
 */
export function ${pascal}Home({ title = '${pascal} Overview' }: Readonly<I${pascal}HomeProps>): React.JSX.Element {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">Feature domain module: ${name}</p>
    </div>
  );
}
`;
}

export function screenTestTemplate(pascal, name) {
  return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ${pascal}Home } from './${name}-home';

describe('${pascal}Home Screen', () => {
  it('renders default title correctly', () => {
    render(<${pascal}Home />);
    expect(screen.getByText('${pascal} Overview')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<${pascal}Home title="Custom Header" />);
    expect(screen.getByText('Custom Header')).toBeInTheDocument();
  });
});
`;
}

/** Thin Next.js App Router page: exports Metadata and renders the feature screen, no business logic. */
export function routeTemplate(pascal, name) {
  return `import type { Metadata } from 'next';
import { ${pascal}Home } from '@/features/${name}/screens/${name}-home';

export const metadata: Metadata = {
  title: '${pascal}',
};

export default function ${pascal}Page() {
  return <${pascal}Home />;
}
`;
}

export function componentTemplate(pascal, type) {
  if (type === 'dialog') {
    const entity = pascal.replace(/FormDialog$/, '');
    return `'use client';

import React from 'react';
import { FormDialog } from '@/components/common/form-dialog';

/**
 * Props for {@link ${pascal}}.
 */
export interface I${pascal}Props {
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
 * Form dialog modal for managing ${entity} entity.
 */
export function ${pascal}({
  open,
  onOpenChange,
  trigger,
  onSuccess,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <FormDialog
      title="${entity}"
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
  }

  if (type === 'section') {
    return `import React from 'react';

/**
 * Props for {@link ${pascal}}.
 */
export interface I${pascal}Props {
  /** Optional CSS class name override. */
  readonly className?: string;
  /** Section heading title. */
  readonly title?: string;
  /** Main content or children. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascal} section component.
 *
 * @param props - Component configuration defined in {@link I${pascal}Props}.
 * @returns Rendered JSX element.
 */
export function ${pascal}({
  className,
  title = '${pascal}',
  children,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <section className={className ?? 'py-6'}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
`;
  }

  return `import React from 'react';

/**
 * Props for {@link ${pascal}}.
 */
export interface I${pascal}Props {
  /** Optional CSS class name override. */
  readonly className?: string;
  /** Main content or children. */
  readonly children?: React.ReactNode;
}

/**
 * ${pascal} component.
 *
 * @param props - Component configuration defined in {@link I${pascal}Props}.
 * @returns Rendered JSX element.
 */
export function ${pascal}({
  className,
  children,
}: Readonly<I${pascal}Props>): React.JSX.Element {
  return (
    <div className={className}>
      {children || <span>${pascal}</span>}
    </div>
  );
}
`;
}

export function componentTestTemplate(pascal, name, type) {
  if (type === 'dialog') {
    const entity = pascal.replace(/FormDialog$/, '');
    return `import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ${pascal} } from './${name}';

describe('${pascal} Component', () => {
  it('renders dialog and handles submission', () => {
    const handleSuccess = vi.fn();
    render(<${pascal} open={true} onSuccess={handleSuccess} />);

    expect(screen.getByText('${entity}')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Guardar'));
    expect(handleSuccess).toHaveBeenCalledTimes(1);
  });
});
`;
  }

  if (type === 'section') {
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ${pascal} } from './${name}';

describe('${pascal} Component', () => {
  it('renders the section heading title', () => {
    render(<${pascal} title="Section Heading" />);
    expect(screen.getByRole('heading', { name: 'Section Heading' })).toBeInTheDocument();
  });

  it('renders children when passed', () => {
    render(<${pascal}><span>Child Content</span></${pascal}>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
`;
  }

  return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ${pascal} } from './${name}';

describe('${pascal} Component', () => {
  it('renders default content correctly', () => {
    render(<${pascal} />);
    expect(screen.getByText('${pascal}')).toBeInTheDocument();
  });

  it('renders children when passed', () => {
    render(<${pascal}><span>Child Content</span></${pascal}>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
`;
}
