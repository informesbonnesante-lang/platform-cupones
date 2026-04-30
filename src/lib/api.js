import { supabase } from './supabaseClient';

// --- Generar número de servicio único (UI) ---
// Formato: YYYYMMDD-NNN  Ej: 20260429-001
export const generateUINumber = async () => {
  const today = new Date();
  const prefix =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  // Buscar el último número generado hoy
  const { data } = await supabase
    .from('coupons')
    .select('ui_number')
    .like('ui_number', `${prefix}-%`)
    .order('ui_number', { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0 && data[0].ui_number) {
    const last = data[0].ui_number; // e.g. "20260429-007"
    seq = parseInt(last.split('-')[1], 10) + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
};

// --- CUPONES ---
export const getCoupons = async () => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener cupones:', error.message);
    return [];
  }
  return data || [];
};

export const saveCoupon = async (coupon) => {
  const { data, error } = await supabase
    .from('coupons')
    .insert([coupon])
    .select()
    .single();

  if (error) {
    console.error('Error al guardar cupón:', error.message);
    return null;
  }
  return data;
};

export const updateCoupon = async (id, updates) => {
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar cupón:', error.message);
    return null;
  }
  return data;
};

// --- PACIENTES (Operaciones masivas por CI) ---
export const updatePatientInfoByCI = async (ci, newName, newPhone) => {
  const { data, error } = await supabase
    .from('coupons')
    .update({ patient_name: newName, telefono: newPhone })
    .eq('patient_ci', ci)
    .select();

  if (error) {
    console.error('Error al actualizar historial del paciente:', error.message);
    return false;
  }
  return data;
};
