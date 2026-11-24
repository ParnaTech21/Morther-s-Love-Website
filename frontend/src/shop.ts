// Edit these to match the real shop.
export const SHOP = {
  phone: '+256 752 600098',
  email: 'hello@example.com',
  address: 'Zana Entebbe Rd., Entebbe',
  hours: 'Sunday–Monday, 9am–6pm',
  currency: 'UGX',
};

export const money = (n: number) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: SHOP.currency, maximumFractionDigits: 0 }).format(n);

// Suggested categories (used in the footer). Products can use any category name in the admin dashboard.
export const CATEGORIES = ['Bags', 'Shoes', 'Sandals', 'School supplies', 'Cookies'];

// Shown in the "Shipping Information" tab on product pages. Edit to match how you deliver.
export const SHIPPING_INFO =
  'Tell us where you are and we’ll confirm delivery options and costs when we confirm your order.';

// Where customers send mobile money. Replace with your real numbers.
export const PAYMENT = { mtn: '07XX XXX XXX', airtel: '07XX XXX XXX', accountName: 'Mother’s Love Crafts' };
