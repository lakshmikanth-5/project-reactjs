const API_URL = 'http://44.201.109.101:8080/api/employees';

async function request(path = '', options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const employeeApi = {
  list: (search = '') => request(search ? `?search=${encodeURIComponent(search)}` : ''),
  get: (id) => request(`/${id}`),
  create: (employee) => request('', { method: 'POST', body: JSON.stringify(employee) }),
  update: (id, employee) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(employee) }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' })
};
