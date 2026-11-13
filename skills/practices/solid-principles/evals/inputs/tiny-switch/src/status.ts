export type Status = 'pending' | 'paid' | 'shipped';

export function statusLabel(status: Status): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'paid':
      return 'Pagado';
    case 'shipped':
      return 'Enviado';
  }
}
