import './App.css';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { employeeApi } from './api.js';

const emptyForm = {
  firstName: '', lastName: '', email: '', department: '',
  jobTitle: '', salary: ''
};

function EmployeeForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial || emptyForm);

  useEffect(() => setForm(initial || emptyForm), [initial]);

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submit(event) {
    event.preventDefault();
    onSave({ ...form, salary: Number(form.salary) });
  }

  return (
    <form className="employee-form" onSubmit={submit}>
      <div className="form-grid">
        <label>First name<input name="firstName" value={form.firstName} onChange={change} required maxLength="80" /></label>
        <label>Last name<input name="lastName" value={form.lastName} onChange={change} required maxLength="80" /></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={change} required maxLength="180" /></label>
        <label>Department<input name="department" value={form.department} onChange={change} required maxLength="100" placeholder="Engineering" /></label>
        <label>Job title<input name="jobTitle" value={form.jobTitle} onChange={change} required maxLength="100" placeholder="Software Engineer" /></label>
        <label>Salary<input type="number" name="salary" value={form.salary} onChange={change} required min="0" step="0.01" /></label>
      </div>
      <div className="form-actions">
        <button disabled={busy} type="submit">{busy ? 'Saving…' : initial?.id ? 'Update employee' : 'Add employee'}</button>
        <button className="secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadEmployees(term = search) {
    setLoading(true);
    try {
      setEmployees(await employeeApi.list(term));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEmployees(''); }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadEmployees(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const totalSalary = useMemo(
    () => employees.reduce((sum, employee) => sum + Number(employee.salary || 0), 0),
    [employees]
  );

  function startAdd() {
    setEditing(null);
    setShowForm(true);
    setError('');
    setNotice('');
  }

  function startEdit(employee) {
    setEditing({ ...employee, salary: String(employee.salary) });
    setShowForm(true);
    setError('');
    setNotice('');
  }

  async function saveEmployee(employee) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (editing?.id) {
        await employeeApi.update(editing.id, employee);
        setNotice('Employee updated successfully.');
      } else {
        await employeeApi.create(employee);
        setNotice('Employee added successfully.');
      }
      setShowForm(false);
      setEditing(null);
      await loadEmployees(search);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) return;
    setError('');
    setNotice('');
    try {
      await employeeApi.remove(employee.id);
      setNotice('Employee deleted successfully.');
      await loadEmployees(search);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
	  <p className="eyebrow">✦ PEOPLE OPERATIONS</p>
          <h1>Employee Hub</h1>
          <p className="subtitle">Manage your team, all in one place.</p>
        </div>
        <button onClick={startAdd}>＋ Add employee</button>
      </header>

      <section className="stats">
        <article className="stat-card"><span>Total employees shown</span><strong>{employees.length}</strong></article>
        <article className="stat-card"><span>Departments represented</span><strong>{new Set(employees.map(e => e.department)).size}</strong></article>
        <article className="stat-card"><span>Salary total (shown)</span><strong>{totalSalary.toLocaleString(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}</strong></article>
      </section>

      {notice && <div className="notice" role="status">{notice}</div>}
      {error && <div className="error" role="alert">{error}</div>}

      {showForm && (
        <section className="panel">
          <h2>{editing ? 'Edit employee' : 'Add a new employee'}</h2>
          <EmployeeForm
            key={editing?.id || 'new'}
            initial={editing}
            onSave={saveEmployee}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            busy={busy}
          />
        </section>
      )}

      <section className="panel">
        <div className="list-heading">
          <div><h2>Team directory</h2><p>Search and manage employee records.</p></div>
          <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, department…" aria-label="Search employees" />
        </div>
        {loading ? <p className="empty">Loading employees…</p> : employees.length === 0 ? (
          <div className="empty"><strong>No employees found</strong><p>Add an employee or try a different search.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Job title</th><th>Salary</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td><div className="person"><span className="avatar">{employee.firstName?.[0] || ''}{employee.lastName?.[0] || ''}</span><div><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.email}</small></div></div></td>
                    <td>{employee.department}</td>
                    <td>{employee.jobTitle}</td>
                    <td>{Number(employee.salary).toLocaleString(undefined, { style: 'currency', currency: 'INR' })}</td>
                    <td><div className="actions"><button className="text-button" onClick={() => startEdit(employee)}>Edit</button><button className="text-button danger-text" onClick={() => deleteEmployee(employee)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer>Employee Management System · React + Spring Boot + MariaDB</footer>
    </main>
  );
}
