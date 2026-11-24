export type Product = {
  id: number; name: string; description: string; price: number; category: string;
  imageUrl: string; isAvailable: boolean; averageRating: number; reviewCount: number;
};
export type ProductInput = Omit<Product, 'id' | 'averageRating' | 'reviewCount'>;
export type Review = { id: number; author: string; rating: number; comment: string; createdAt: string };
export type AdminReview = Review & { approved: boolean; productName: string };
export type Message = { id: number; name: string; email: string; message: string; createdAt: string };

export type AdminOrder = {
  id: number; reference: string; customerName: string; phone: string; address: string; notes: string;
  paymentMethod: string; paymentReference: string; total: number; status: string; createdAt: string;
  items: { productName: string; unitPrice: number; quantity: number }[];
};

const KEY = 'mlc_token';
export const auth = {
  get: () => localStorage.getItem(KEY),
  set: (t: string) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

async function req<T>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (admin && auth.get()) headers.Authorization = `Bearer ${auth.get()}`;
  const res = await fetch(`/api${path}`, { ...init, headers });
  if (res.status === 401 && admin) {
    auth.clear();
    window.dispatchEvent(new Event('mlc-logout'));
  }
  if (!res.ok) {
    let msg = res.statusText || 'Something went wrong.';
    try { msg = (await res.json()).error ?? msg; } catch { /* no body */ }
    throw new Error(res.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : msg);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const send = (method: string, body?: unknown): RequestInit => ({ method, body: body ? JSON.stringify(body) : undefined });

export const api = {
  products: (category?: string) => req<Product[]>(`/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  product: (id: string) => req<{ product: Product; reviews: Review[] }>(`/products/${id}`),
  addReview: (id: number, b: { author: string; rating: number; comment: string }) => req<void>(`/products/${id}/reviews`, send('POST', b)),
  contact: (b: { name: string; email: string; message: string }) => req<void>('/contact', send('POST', b)),
  placeOrder: (b: unknown) => req<{ reference: string; total: number }>('/orders', send('POST', b)),
  login: (username: string, password: string) => req<{ token: string }>('/auth/login', send('POST', { username, password })),
  admin: {
    products: () => req<Product[]>('/admin/products', {}, true),
    saveProduct: (input: ProductInput, id?: number) =>
      req<unknown>(id ? `/admin/products/${id}` : '/admin/products', send(id ? 'PUT' : 'POST', input), true),
    deleteProduct: (id: number) => req<void>(`/admin/products/${id}`, send('DELETE'), true),
    reviews: () => req<AdminReview[]>('/admin/reviews', {}, true),
    approveReview: (id: number) => req<void>(`/admin/reviews/${id}/approve`, send('PUT'), true),
    deleteReview: (id: number) => req<void>(`/admin/reviews/${id}`, send('DELETE'), true),
    messages: () => req<Message[]>('/admin/messages', {}, true),
    orders: () => req<AdminOrder[]>('/admin/orders', {}, true),
    setOrderStatus: (id: number, status: string) => req<void>(`/admin/orders/${id}/status`, send('PUT', { status }), true),
  },
};
