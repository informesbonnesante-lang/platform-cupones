'use client';

// Simulate DB operations using localStorage for immediate testing without Supabase
export const getCoupons = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('medcupon_coupons');
  return data ? JSON.parse(data) : [];
};

export const saveCoupon = (coupon) => {
  const coupons = getCoupons();
  const newCoupon = {
    ...coupon,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
  };
  localStorage.setItem('medcupon_coupons', JSON.stringify([...coupons, newCoupon]));
  return newCoupon;
};

export const updateCoupon = (id, updates) => {
  const coupons = getCoupons();
  const index = coupons.findIndex(c => c.id === id || c.code === id);
  if (index !== -1) {
    coupons[index] = { ...coupons[index], ...updates };
    localStorage.setItem('medcupon_coupons', JSON.stringify(coupons));
    return coupons[index];
  }
  return null;
};
