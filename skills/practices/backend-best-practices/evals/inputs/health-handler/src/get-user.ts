export interface User {
  id: string;
  name: string;
}

export interface UserStore {
  findById(id: string): Promise<User | null>;
}

const ID_PATTERN = /^[a-z0-9-]{1,36}$/;

export async function getUser(store: UserStore, requesterId: string | undefined, id: string) {
  if (!requesterId) return { status: 401, body: { code: 'UNAUTHENTICATED' } };
  if (!ID_PATTERN.test(id)) return { status: 400, body: { code: 'INVALID_ID' } };
  if (requesterId !== id) return { status: 403, body: { code: 'FORBIDDEN' } };

  const user = await store.findById(id);
  if (!user) return { status: 404, body: { code: 'NOT_FOUND' } };
  return { status: 200, body: { id: user.id, name: user.name } };
}
