/**
 * Client-side cart state management using localStorage.
 */

export interface CartItem {
  slug: string;
  title: string;
  price: number;
  currency: string;
  thumbnail: string;
  type: 'font' | 'script';
  quantity: number;
}

const CART_KEY = 'shlemut-cart';

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
}

export function addToCart(item: Omit<CartItem, 'quantity'>): void {
  const cart = getCart();
  const existing = cart.find((i) => i.slug === item.slug);
  if (existing) {
    // Digital goods — max 1 per product
    return;
  }
  cart.push({ ...item, quantity: 1 });
  saveCart(cart);
}

export function removeFromCart(slug: string): void {
  const cart = getCart().filter((i) => i.slug !== slug);
  saveCart(cart);
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartItems(): CartItem[] {
  return getCart();
}

export function getCartCount(): number {
  return getCart().length;
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function isInCart(slug: string): boolean {
  return getCart().some((i) => i.slug === slug);
}
