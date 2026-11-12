export const fullName = (u) =>
  `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;

export function errorText(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data || typeof data === 'string') return fallback;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
    .join(' | ');
}