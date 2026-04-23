import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { 
  Repeat, Plus, Trash2, Edit3, X, Check, 
  Calendar, CreditCard, Bell, ChevronRight, 
  ArrowRight, IndianRupee, Clock, Zap
} from 'lucide-react';
import './Recurring.css';

export default function Recurring() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly',
    nextDate: new Date().toISOString().split('T')[0],
    category: 'Subscription'
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('recurring')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
        setSubscriptions(data.map(d => ({ ...d, nextDate: d.next_date })));
      }
    };
    fetchData();
  }, [user]);

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      frequency: 'monthly',
      nextDate: new Date().toISOString().split('T')[0],
      category: 'Subscription'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    if (editingId) {
      const { error } = await supabase
        .from('recurring')
        .update({
          name: form.name,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
          next_date: form.nextDate
        })
        .eq('id', editingId);

      if (!error) {
        setSubscriptions(prev => prev.map(sub =>
          sub.id === editingId
            ? { ...sub, ...form, amount: parseFloat(form.amount), nextDate: form.nextDate }
            : sub
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('recurring')
        .insert({
          user_id: user.id,
          name: form.name,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
          next_date: form.nextDate
        })
        .select()
        .single();

      if (!error && data) {
        setSubscriptions(prev => [...prev, { ...data, nextDate: data.next_date }]);
      }
    }
    resetForm();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('recurring').delete().eq('id', id);
    if (!error) {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleEdit = (sub) => {
    setForm({
      name: sub.name,
      amount: sub.amount.toString(),
      frequency: sub.frequency,
      nextDate: sub.nextDate,
      category: sub.category
    });
    setEditingId(sub.id);
    setShowForm(true);
  };

  const calculateDaysRemaining = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(dateStr);
    next.setHours(0, 0, 0, 0);
    
    // If date is in the past, assume it's next month (simplified recurring logic)
    if (next < today) {
      next.setMonth(next.getMonth() + 1);
    }
    
    const diffTime = next - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalMonthlyCommitment = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      const amount = sub.amount;
      if (sub.frequency === 'yearly') return acc + (amount / 12);
      if (sub.frequency === 'weekly') return acc + (amount * 4);
      return acc + amount;
    }, 0);
  }, [subscriptions]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="recurring-page">
      <div className="container">
        <div className="recurring-header animate-fadeInUp">
          <div>
            <h1 className="recurring-title">Recurring <span className="accent-text">Payments</span></h1>
            <p className="recurring-subtitle">Management of your subscriptions and monthly bills</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
            id="add-recurring-btn"
          >
            <Plus size={18} />
            Add Subscription
          </button>
        </div>

        <div className="recurring-overview animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="overview-card glass-card">
            <div className="overview-info">
              <span>Monthly Commitment</span>
              <h2>{formatCurrency(totalMonthlyCommitment)}</h2>
            </div>
            <div className="overview-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
              <Zap size={24} />
            </div>
          </div>
          <div className="overview-card glass-card">
            <div className="overview-info">
              <span>Active Subscriptions</span>
              <h2>{subscriptions.length}</h2>
            </div>
            <div className="overview-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>
              <Bell size={24} />
            </div>
          </div>
        </div>

        <div className="recurring-list animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {subscriptions.length === 0 ? (
            <div className="empty-recurring glass-card">
              <Clock size={48} className="empty-icon" />
              <h3>No recurring payments tracked</h3>
              <p>Add your Netflix, Rent, or Internet bills to stay on top of your finances.</p>
              <button className="btn btn-secondary" onClick={() => setShowForm(true)}>
                Get Started
              </button>
            </div>
          ) : (
            <div className="subscription-grid">
              {subscriptions.map((sub) => {
                const daysLeft = calculateDaysRemaining(sub.nextDate);
                const isDueSoon = daysLeft <= 5;
                
                return (
                  <div key={sub.id} className="sub-card glass-card">
                    <div className="sub-header">
                      <div className="sub-icon-box">
                        <CreditCard size={20} />
                      </div>
                      <div className="sub-actions">
                        <button className="btn-icon-sm" onClick={() => handleEdit(sub)}><Edit3 size={14} /></button>
                        <button className="btn-icon-sm danger" onClick={() => handleDelete(sub.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    
                    <div className="sub-body">
                      <h4 className="sub-name">{sub.name}</h4>
                      <div className="sub-meta">
                        <span className="sub-category">{sub.category}</span>
                        <span className="sub-frequency">{sub.frequency}</span>
                      </div>
                      <div className="sub-amount">{formatCurrency(sub.amount)}</div>
                    </div>

                    <div className="sub-footer">
                      <div className="sub-progress-box">
                        <div className="sub-progress-label">
                          <span>Next Bill</span>
                          <span className={isDueSoon ? 'due-soon' : ''}>
                            {isDueSoon ? `${daysLeft} days left` : `in ${daysLeft} days`}
                          </span>
                        </div>
                        <div className="sub-progress-bar">
                          <div 
                            className={`sub-progress-fill ${isDueSoon ? 'warning' : ''}`}
                            style={{ width: `${Math.max(5, 100 - (daysLeft * 3.3))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal glass-card animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group">
                <label>Service Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Netflix, Spotify" 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                />
              </div>
              <div className="modal-row">
                <div className="input-group">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="0" 
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Frequency</label>
                  <select 
                    className="input-field"
                    value={form.frequency}
                    onChange={(e) => setForm({...form, frequency: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Next Billing Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={form.nextDate}
                  onChange={(e) => setForm({...form, nextDate: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} />
                  {editingId ? 'Update' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
