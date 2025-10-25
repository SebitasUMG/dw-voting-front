import React, { createContext, useContext, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ==================== TIPOS ====================
interface User {
  id: string;
  numeroColegiado: string;
  nombreCompleto: string;
  email: string;
  dpi: string;
  role: 'voter' | 'admin';
}

interface Candidato {
  id: string;
  nombre: string;
  descripcion: string;
  votos: number;
}

interface Campana {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'habilitada' | 'deshabilitada' | 'finalizada';
  candidatos: Candidato[];
  votantes: string[];
  cantidadVotos: number;
}

// ==================== CONTEXT ====================
interface AuthContextType {
  user: User | null;
  login: (numeroColegiado: string, dpi: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

// ==================== AUTH PROVIDER ====================
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('votacion_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('votacion_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('votacion_user');
    }
  }, [user]);

  const login = async (numeroColegiado: string, dpi: string, password: string) => {
    // Simular validación de credenciales
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Credenciales de admin por defecto
    if (numeroColegiado === 'admin' && dpi === '1234567890123' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-1',
        numeroColegiado: 'admin',
        nombreCompleto: 'Administrador del Sistema',
        email: 'admin@colegiodeingenieros.org',
        dpi: '1234567890123',
        role: 'admin'
      };
      setUser(adminUser);
      return;
    }

    // Validar DPI (13 dígitos) y contraseña (mínimo 8 caracteres)
    if (dpi.length !== 13) {
      throw new Error('El DPI debe tener 13 dígitos');
    }
    
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Buscar usuario en localStorage
    const users = JSON.parse(localStorage.getItem('votacion_users') || '[]');
    const foundUser = users.find((u: User) => 
      u.numeroColegiado === numeroColegiado && u.dpi === dpi && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
    } else {
      throw new Error('Credenciales inválidas');
    }
  };

  const register = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const users = JSON.parse(localStorage.getItem('votacion_users') || '[]');
    
    // Verificar si ya existe el número de colegiado o DPI
    if (users.some((u: User) => u.numeroColegiado === data.numeroColegiado)) {
      throw new Error('El número de colegiado ya está registrado');
    }
    
    if (users.some((u: User) => u.dpi === data.dpi)) {
      throw new Error('El DPI ya está registrado');
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      numeroColegiado: data.numeroColegiado,
      nombreCompleto: data.nombreCompleto,
      email: data.email,
      dpi: data.dpi,
      role: 'voter',
      password: data.password // En una app real, esto debería estar hasheado
    };

    users.push(newUser);
    localStorage.setItem('votacion_users', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
  };

  const logout = () => {
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== DATA STORE ====================
const useCampanasStore = () => {
  const [campanas, setCampanas] = useState<Campana[]>(() => {
    const saved = localStorage.getItem('votacion_campanas');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        titulo: 'Elección Junta Directiva 2025',
        descripcion: 'Elección de los miembros de la Junta Directiva del Colegio de Ingenieros para el período 2025-2027',
        estado: 'habilitada',
        cantidadVotos: 1,
        votantes: [],
        candidatos: [
          { id: 'c1', nombre: 'Ing. Juan Carlos Pérez', descripcion: 'Especialista en Infraestructura', votos: 0 },
          { id: 'c2', nombre: 'Ing. María González', descripcion: 'Experta en Desarrollo Sostenible', votos: 0 },
          { id: 'c3', nombre: 'Ing. Roberto López', descripcion: 'Líder en Innovación Tecnológica', votos: 0 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('votacion_campanas', JSON.stringify(campanas));
  }, [campanas]);

  const addCampana = (campana: Omit<Campana, 'id' | 'votantes'>) => {
    const newCampana: Campana = {
      ...campana,
      id: 'camp-' + Date.now(),
      votantes: []
    };
    setCampanas([...campanas, newCampana]);
  };

  const updateCampana = (id: string, updates: Partial<Campana>) => {
    setCampanas(campanas.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCampana = (id: string) => {
    setCampanas(campanas.filter(c => c.id !== id));
  };

  const addCandidato = (campanaId: string, candidato: Omit<Candidato, 'id' | 'votos'>) => {
    setCampanas(campanas.map(c => {
      if (c.id === campanaId) {
        return {
          ...c,
          candidatos: [...c.candidatos, { ...candidato, id: 'cand-' + Date.now(), votos: 0 }]
        };
      }
      return c;
    }));
  };

  const deleteCandidato = (campanaId: string, candidatoId: string) => {
    setCampanas(campanas.map(c => {
      if (c.id === campanaId) {
        return { ...c, candidatos: c.candidatos.filter(cand => cand.id !== candidatoId) };
      }
      return c;
    }));
  };

  const votar = (campanaId: string, candidatoId: string, userId: string) => {
    setCampanas(campanas.map(c => {
      if (c.id === campanaId) {
        if (c.votantes.includes(userId)) {
          throw new Error('Ya has votado en esta campaña');
        }
        return {
          ...c,
          votantes: [...c.votantes, userId],
          candidatos: c.candidatos.map(cand =>
            cand.id === candidatoId ? { ...cand, votos: cand.votos + 1 } : cand
          )
        };
      }
      return c;
    }));
  };

  return { campanas, addCampana, updateCampana, deleteCampana, addCandidato, deleteCandidato, votar };
};

// ==================== COMPONENTES UI ====================
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  disabled?: boolean;
}> = ({ children, onClick, variant = 'primary', type = 'button', fullWidth, disabled }) => {
  const baseStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white' },
    secondary: { background: '#64748b', color: 'white' },
    danger: { background: '#ef4444', color: 'white' },
    success: { background: '#10b981', color: 'white' },
    outline: { background: 'transparent', border: '2px solid #2563eb', color: '#2563eb' }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[variant] }}
      onMouseOver={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
}> = ({ label, error, ...props }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#1e293b' }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px',
          border: `2px solid ${error ? '#ef4444' : '#cbd5e1'}`,
          borderRadius: '8px',
          fontSize: '16px',
          outline: 'none',
          transition: 'border 0.2s',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
        onBlur={(e) => e.target.style.borderColor = error ? '#ef4444' : '#cbd5e1'}
      />
      {error && <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; onClick?: () => void; hover?: boolean }> = ({ children, onClick, hover }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        cursor: hover ? 'pointer' : 'default',
        transition: 'all 0.3s'
      }}
      onMouseOver={(e) => hover && (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </div>
  );
};

// ==================== PÁGINAS ====================

// LOGIN
const Login: React.FC<{ onSuccess: () => void; onRegister: () => void }> = ({ onSuccess, onRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ numeroColegiado: '', dpi: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.numeroColegiado, formData.dpi, formData.password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '10px' }}>🗳️ Sistema de Votación</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>Colegio de Ingenieros de Guatemala</p>
        </div>
        
        <Card>
          <h2 style={{ marginBottom: '10px' }}>Iniciar Sesión</h2>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
            Demo: admin/1234567890123/admin123 o cualquier colegiado/13 dígitos/12345678
          </p>
          
          <form onSubmit={handleSubmit}>
            <Input
              label="Número de Colegiado"
              type="text"
              value={formData.numeroColegiado}
              onChange={(e) => setFormData({ ...formData, numeroColegiado: e.target.value })}
              placeholder="Ej: 12345"
              required
            />
            <Input
              label="DPI"
              type="text"
              value={formData.dpi}
              onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
              placeholder="1234567890123"
              maxLength={13}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
            
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                {error}
              </div>
            )}
            
            <Button type="submit" variant="primary" fullWidth>Iniciar Sesión</Button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{ color: '#64748b' }}>¿No tienes cuenta? </span>
              <button
                type="button"
                onClick={onRegister}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Regístrate aquí
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// REGISTER
const Register: React.FC<{ onSuccess: () => void; onLogin: () => void }> = ({ onSuccess, onLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    numeroColegiado: '',
    nombreCompleto: '',
    email: '',
    dpi: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<any>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    
    if (formData.dpi.length !== 13) newErrors.dpi = 'El DPI debe tener 13 dígitos';
    if (formData.password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await register(formData);
      onSuccess();
    } catch (err: any) {
      setErrors({ general: err.message });
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '10px' }}>Registro</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)' }}>Crea tu cuenta para votar</p>
        </div>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              label="Número de Colegiado"
              type="text"
              value={formData.numeroColegiado}
              onChange={(e) => setFormData({ ...formData, numeroColegiado: e.target.value })}
              required
            />
            <Input
              label="Nombre Completo"
              type="text"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="DPI"
              type="text"
              value={formData.dpi}
              onChange={(e) => setFormData({ ...formData, dpi: e.target.value })}
              maxLength={13}
              error={errors.dpi}
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
            />
            <Input
              label="Confirmar Contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              required
            />
            
            {errors.general && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                {errors.general}
              </div>
            )}
            
            <Button type="submit" variant="primary" fullWidth>Registrarse</Button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{ color: '#64748b' }}>¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={onLogin}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Inicia sesión
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// NAVBAR
const Navbar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user, isAdmin } = useAuth();
  
  return (
    <nav style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.5rem' }}>🗳️</span>
        <span style={{ fontWeight: '700', fontSize: '1.2rem' }}>Sistema de Votación</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b' }}>{user?.nombreCompleto}</span>
        {isAdmin() && <span style={{ background: '#2563eb', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>ADMIN</span>}
        <Button variant="danger" onClick={onLogout}>Cerrar Sesión</Button>
      </div>
    </nav>
  );
};

// DASHBOARD VOTANTE
const VoterDashboard: React.FC = () => {
  const { campanas, votar } = useCampanasStore();
  const { user } = useAuth();
  const [selectedCampana, setSelectedCampana] = useState<Campana | null>(null);
  const [selectedCandidato, setSelectedCandidato] = useState<string>('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleVotar = () => {
    if (!selectedCampana || !selectedCandidato || !user) return;
    
    try {
      votar(selectedCampana.id, selectedCandidato, user.id);
      setSuccess('¡Voto registrado exitosamente!');
      setSelectedCandidato('');
      setTimeout(() => {
        setSuccess('');
        setSelectedCampana(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (selectedCampana) {
    const campanaActualizada = campanas.find(c => c.id === selectedCampana.id) || selectedCampana;
    const haVotado = campanaActualizada.votantes.includes(user?.id || '');
    const COLORS = ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];
    const chartData = campanaActualizada.candidatos.map(c => ({ nombre: c.nombre, votos: c.votos }));

    return (
      <div style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <Button variant="outline" onClick={() => {setSelectedCampana(null); setError(''); setSuccess('');}}>← Volver</Button>
        
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{campanaActualizada.titulo}</h1>
            <span style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: '600',
              background: campanaActualizada.estado === 'habilitada' ? '#10b981' : '#f59e0b',
              color: 'white'
            }}>
              {campanaActualizada.estado.toUpperCase()}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{campanaActualizada.descripcion}</p>
        </div>

        {success && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#10b981', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            {error}
          </div>
        )}

        {haVotado && (
          <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid #06b6d4', color: '#06b6d4', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
            ✓ Ya has emitido tu voto en esta campaña
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px' }}>
          <div>
            <h2 style={{ marginBottom: '24px' }}>Candidatos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {campanaActualizada.candidatos.map((candidato) => (
                <Card
                  key={candidato.id}
                  hover={!haVotado && campanaActualizada.estado === 'habilitada'}
                  onClick={() => !haVotado && campanaActualizada.estado === 'habilitada' && setSelectedCandidato(candidato.id)}
                >
                  <div style={{
                    border: selectedCandidato === candidato.id ? '3px solid #2563eb' : '2px solid transparent',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        👤
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 4px 0' }}>{candidato.nombre}</h3>
                        <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>{candidato.descripcion}</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{candidato.votos}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>votos</div>
                      </div>
                    </div>
                    {selectedCandidato === candidato.id && !haVotado && (
                      <div style={{ marginTop: '12px', background: '#2563eb', color: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: '600' }}>
                        ✓ Seleccionado
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {!haVotado && campanaActualizada.estado === 'habilitada' && (
              <div style={{ marginTop: '24px' }}>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleVotar}
                  disabled={!selectedCandidato}
                >
                  Confirmar Voto
                </Button>
              </div>
            )}
          </div>

          <div>
            <Card>
              <h2 style={{ marginBottom: '24px' }}>Resultados en Tiempo Real</h2>
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {campanaActualizada.candidatos.reduce((sum, c) => sum + c.votos, 0)}
                </div>
                <div style={{ color: '#64748b' }}>Total de Votos</div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} style={{fontSize: '12px'}} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="votos" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ marginTop: '24px' }}>
                {campanaActualizada.candidatos.map((candidato, index) => {
                  const total = campanaActualizada.candidatos.reduce((sum, c) => sum + c.votos, 0);
                  const percentage = total > 0 ? ((candidato.votos / total) * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={candidato.id} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '500' }}>{candidato.nombre}</span>
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{percentage}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${percentage}%`,
                          background: COLORS[index % COLORS.length],
                          transition: 'width 0.5s'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Campañas de Votación
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Selecciona una campaña para ver los candidatos y emitir tu voto</p>
      </div>

      {campanas.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🗳️</div>
            <h3>No hay campañas disponibles</h3>
            <p style={{ color: '#64748b' }}>Actualmente no hay campañas de votación activas</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {campanas.map((campana) => (
            <Card key={campana.id} hover onClick={() => setSelectedCampana(campana)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{campana.titulo}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: campana.estado === 'habilitada' ? '#10b981' : campana.estado === 'deshabilitada' ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}>
                  {campana.estado}
                </span>
              </div>
              
              <p style={{ color: '#64748b', marginBottom: '20px' }}>{campana.descripcion}</p>
              
              <div style={{ display: 'flex', gap: '24px', padding: '16px', background: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Candidatos</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{campana.candidatos.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Votos emitidos</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{campana.votantes.length}</div>
                </div>
              </div>

              {campana.estado === 'habilitada' && (
                <div style={{ marginTop: '16px' }}>
                  <Button variant="primary" fullWidth>Ver Candidatos y Votar →</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// DASHBOARD ADMIN
const AdminDashboard: React.FC = () => {
  const { campanas, addCampana, updateCampana, deleteCampana, addCandidato, deleteCandidato } = useCampanasStore();
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'candidates'>('list');
  const [selectedCampana, setSelectedCampana] = useState<Campana | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    cantidadVotos: 1,
    estado: 'deshabilitada' as 'habilitada' | 'deshabilitada' | 'finalizada'
  });
  const [candidatoForm, setCandidatoForm] = useState({ nombre: '', descripcion: '' });

  const handleCreateCampana = () => {
    addCampana({
      ...formData,
      candidatos: []
    });
    setFormData({ titulo: '', descripcion: '', cantidadVotos: 1, estado: 'deshabilitada' });
    setView('list');
  };

  const handleEditCampana = () => {
    if (selectedCampana) {
      updateCampana(selectedCampana.id, formData);
      setView('list');
      setSelectedCampana(null);
    }
  };

  const handleToggleEstado = (campana: Campana) => {
    const nuevoEstado = campana.estado === 'habilitada' ? 'deshabilitada' : 'habilitada';
    updateCampana(campana.id, { estado: nuevoEstado });
  };

  const handleAddCandidato = () => {
    if (selectedCampana && candidatoForm.nombre) {
      addCandidato(selectedCampana.id, candidatoForm);
      setCandidatoForm({ nombre: '', descripcion: '' });
    }
  };

  // Vista de gestión de candidatos
  if (view === 'candidates' && selectedCampana) {
    const campana = campanas.find(c => c.id === selectedCampana.id);
    
    return (
      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Button variant="outline" onClick={() => { setView('list'); setSelectedCampana(null); }}>← Volver</Button>
        
        <div style={{ marginTop: '24px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{campana?.titulo}</h1>
          <p style={{ color: '#64748b' }}>Gestiona los candidatos de esta campaña</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px' }}>
          <div>
            <Card>
              <h3 style={{ marginBottom: '20px' }}>Agregar Candidato</h3>
              <Input
                label="Nombre del Candidato"
                type="text"
                value={candidatoForm.nombre}
                onChange={(e) => setCandidatoForm({ ...candidatoForm, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
              <Input
                label="Descripción"
                type="text"
                value={candidatoForm.descripcion}
                onChange={(e) => setCandidatoForm({ ...candidatoForm, descripcion: e.target.value })}
                placeholder="Breve descripción"
              />
              <Button variant="primary" onClick={handleAddCandidato} fullWidth>Agregar Candidato</Button>
            </Card>
          </div>

          <div>
            <h3 style={{ marginBottom: '20px' }}>Candidatos ({campana?.candidatos.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {campana?.candidatos.map((candidato) => (
                <Card key={candidato.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0' }}>{candidato.nombre}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{candidato.descripcion}</p>
                      <div style={{ marginTop: '8px', color: '#2563eb', fontWeight: 'bold' }}>
                        {candidato.votos} votos
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => deleteCandidato(campana.id, candidato.id)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de crear/editar campaña
  if (view === 'create' || view === 'edit') {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <Button variant="outline" onClick={() => setView('list')}>← Volver</Button>
        
        <div style={{ marginTop: '24px', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem' }}>{view === 'create' ? 'Nueva Campaña' : 'Editar Campaña'}</h1>
          <p style={{ color: '#64748b' }}>Completa los datos de la campaña de votación</p>
        </div>

        <Card>
          <Input
            label="Título de la Campaña"
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ej: Elección Junta Directiva 2025"
          />
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px',
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Describe la campaña electoral..."
            />
          </div>

          <Input
            label="Cantidad de Votos por Usuario"
            type="number"
            value={formData.cantidadVotos.toString()}
            onChange={(e) => setFormData({ ...formData, cantidadVotos: parseInt(e.target.value) || 1 })}
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="deshabilitada">Deshabilitada</option>
              <option value="habilitada">Habilitada</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setView('list')}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={view === 'create' ? handleCreateCampana : handleEditCampana}
            >
              {view === 'create' ? 'Crear Campaña' : 'Actualizar Campaña'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Vista principal de lista de campañas
  return (
    <div style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Panel de Administración
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '8px' }}>Gestiona campañas y candidatos</p>
        </div>
        <Button variant="primary" onClick={() => setView('create')}>+ Nueva Campaña</Button>
      </div>

      {campanas.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📋</div>
            <h3>No hay campañas creadas</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Comienza creando tu primera campaña de votación</p>
            <Button variant="primary" onClick={() => setView('create')}>Crear Campaña</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {campanas.map((campana) => (
            <Card key={campana.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{campana.titulo}</h3>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: campana.estado === 'habilitada' ? '#10b981' : campana.estado === 'deshabilitada' ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}>
                  {campana.estado}
                </span>
              </div>

              <p style={{ color: '#64748b', marginBottom: '20px' }}>{campana.descripcion}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Candidatos</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{campana.candidatos.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Votos máx.</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{campana.cantidadVotos}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Votantes</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{campana.votantes.length}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampana(campana);
                    setFormData({
                      titulo: campana.titulo,
                      descripcion: campana.descripcion,
                      cantidadVotos: campana.cantidadVotos,
                      estado: campana.estado
                    });
                    setView('edit');
                  }}
                >
                  ✏️ Editar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampana(campana);
                    setView('candidates');
                  }}
                >
                  👥 Candidatos
                </Button>

                {campana.estado !== 'finalizada' && (
                  <Button
                    variant={campana.estado === 'habilitada' ? 'danger' : 'success'}
                    onClick={() => handleToggleEstado(campana)}
                  >
                    {campana.estado === 'habilitada' ? '⏸️ Deshabilitar' : '▶️ Habilitar'}
                  </Button>
                )}

                {campana.estado === 'habilitada' && (
                  <Button
                    variant="danger"
                    onClick={() => updateCampana(campana.id, { estado: 'finalizada' })}
                  >
                    🔒 Cerrar
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('¿Eliminar esta campaña?')) {
                      deleteCampana(campana.id);
                    }
                  }}
                >
                  🗑️
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== APP PRINCIPAL ====================
const AppContent: React.FC = () => {
  const [page, setPage] = useState<'login' | 'register' | 'dashboard'>('login');
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      setPage('dashboard');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    setPage('login');
  };

  if (page === 'login') {
    return <Login onSuccess={() => setPage('dashboard')} onRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <Register onSuccess={() => setPage('dashboard')} onLogin={() => setPage('login')} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Navbar onLogout={handleLogout} />
      {isAdmin() ? <AdminDashboard /> : <VoterDashboard />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}