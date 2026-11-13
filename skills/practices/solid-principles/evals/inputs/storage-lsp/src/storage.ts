export interface FileStorage {
  read(path: string): Promise<string>;
  save(path: string, data: string): Promise<void>;
  delete(path: string): Promise<void>;
}

export class MemoryStorage implements FileStorage {
  private files = new Map<string, string>();

  async read(path: string): Promise<string> {
    const data = this.files.get(path);
    if (data === undefined) throw new Error('not found: ' + path);
    return data;
  }

  async save(path: string, data: string): Promise<void> {
    this.files.set(path, data);
  }

  async delete(path: string): Promise<void> {
    this.files.delete(path);
  }
}

export class ArchiveStorage implements FileStorage {
  private files: Record<string, string>;

  constructor(files: Record<string, string>) {
    this.files = files;
  }

  async read(path: string): Promise<string> {
    return this.files[path] ?? '';
  }

  async save(): Promise<void> {
    throw new Error('archive is read-only');
  }

  async delete(): Promise<void> {
    throw new Error('archive is read-only');
  }
}

export async function backup(from: FileStorage, to: FileStorage, paths: string[]): Promise<void> {
  for (const path of paths) {
    await to.save(path, await from.read(path));
  }
}

export async function purgeTemp(storage: FileStorage, paths: string[]): Promise<void> {
  for (const path of paths) {
    if (path.startsWith('tmp/')) await storage.delete(path);
  }
}
