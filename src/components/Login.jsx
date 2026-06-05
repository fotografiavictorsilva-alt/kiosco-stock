import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '12px',
            background: 'var(--primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem',
            fontSize: '1.5rem', fontWeight: 700, color: 'white'
          }}>VS</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>VS Gestión</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isRegister ? 'Crear cuenta nueva' : 'Iniciá sesión para continuar'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
            borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem',
            color: 'var(--danger)', fontSize: '0.875rem'
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Ingresar'}
          </button>
          <button
            <button
    className="btn btn-ghost"
    onClick={() => setIsRegister(!isRegister)}
    style={{ width: '100%' }}
  >
    {isRegister ? '¿Ya tenés cuenta? Iniciá sesión' : '¿Primera vez? Crear cuenta'}
  </button>
  {!isRegister && (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        if (!email) { setError('Ingresá tu email primero'); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else setError('✅ Te enviamos un email para restablecer tu contraseña');
      }}
      style={{ width: '100%', fontSize: '0.85rem' }}
    >
      ¿Olvidaste tu contraseña?
    </button>
  )}
          </button>
        </div>
      </div>
    </div>
  );
}