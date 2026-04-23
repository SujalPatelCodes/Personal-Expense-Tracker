import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import {
  Plus, Trash2, Edit3, X, Check, TrendingUp, TrendingDown,
  Wallet, Calendar, Filter, Search, ArrowUpRight, ArrowDownRight,
  ShoppingCart, Coffee, Car, Home, Zap, Heart, GraduationCap,
  Gamepad2, MoreHorizontal, ChevronDown, IndianRupee, PieChart,
  Repeat, Bell, CreditCard, Clock, History, Download
} from 'lucide-react';
import './Dashboard.css';

const CATEGORIES = [
  { name: 'Food & Dining', icon: Coffee, color: '#f59e0b' },
  { name: 'Shopping', icon: ShoppingCart, color: '#6366f1' },
  { name: 'Transport', icon: Car, color: '#3b82f6' },
  { name: 'Housing', icon: Home, color: '#10b981' },
  { name: 'Utilities', icon: Zap, color: '#ef4444' },
  { name: 'Health', icon: Heart, color: '#ec4899' },
  { name: 'Education', icon: GraduationCap, color: '#8b5cf6' },
  { name: 'Entertainment', icon: Gamepad2, color: '#14b8a6' },
  { name: 'Other', icon: MoreHorizontal, color: '#6b7280' },
];

const getCategoryData = (name) => CATEGORIES.find(c => c.name === name) || CATEGORIES[8];

export default function Dashboard() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyMonth, setHistoryMonth] = useState('all');

  const fullHistory = useMemo(() => {
    const all = [
      ...expenses.map(e => ({ ...e, type: 'expense', timestamp: new Date(e.date || e.created_at || new Date()).getTime() })),
      ...subscriptions.map(s => ({ ...s, type: 'recurring', timestamp: new Date(s.nextDate || s.created_at || new Date()).getTime() }))
    ];
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [expenses, subscriptions]);

  const historyMonths = useMemo(() => {
    const months = new Set();
    fullHistory.forEach(item => {
      const d = new Date(item.timestamp);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [fullHistory]);

  const filteredHistory = useMemo(() => {
    if (historyMonth === 'all') return fullHistory;
    return fullHistory.filter(item => {
      const d = new Date(item.timestamp);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === historyMonth;
    });
  }, [fullHistory, historyMonth]);

  const historyTotal = useMemo(() => {
    return filteredHistory.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredHistory]);

  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, type: null, title: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: expData }, { data: subData }] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('recurring').select('*').eq('user_id', user.id)
      ]);
      if (expData) setExpenses(expData);
      if (subData) setSubscriptions(subData.map(s => ({ ...s, nextDate: s.next_date })));
    };
    fetchData();
  }, [user]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (showForm || showRecurringForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm, showRecurringForm]);

  const resetRecurringForm = () => {
    setEditingRecurringId(null);
    if(document.getElementById('new-sub-name')) document.getElementById('new-sub-name').value = '';
    if(document.getElementById('new-sub-amount')) document.getElementById('new-sub-amount').value = '';
    if(document.getElementById('new-sub-freq')) document.getElementById('new-sub-freq').value = 'monthly';
    if(document.getElementById('new-sub-date')) document.getElementById('new-sub-date').value = new Date().toISOString().split('T')[0];
  };

  const resetForm = () => {
    setForm({
      title: '',
      amount: '',
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return;

    if (editingId) {
      const { error } = await supabase
        .from('expenses')
        .update({
          title: form.title,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          notes: form.notes
        })
        .eq('id', editingId);

      if (!error) {
        setExpenses(prev => prev.map(exp =>
          exp.id === editingId
            ? { ...exp, ...form, amount: parseFloat(form.amount) }
            : exp
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          title: form.title,
          amount: parseFloat(form.amount),
          category: form.category,
          date: form.date,
          notes: form.notes
        })
        .select()
        .single();

      if (!error && data) {
        setExpenses(prev => [data, ...prev]);
      }
    }
    resetForm();
  };

  const handleEdit = (expense) => {
    setForm({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || ''
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const requestDelete = (id, type, title) => {
    setConfirmDelete({ show: true, id, type, title });
  };

  const exportToCSV = () => {
    if (fullHistory.length === 0) return;
    const headers = ['Type', 'Title/Name', 'Category/Frequency', 'Amount (INR)', 'Date'];
    const rows = fullHistory.map(item => {
      const type = item.type === 'expense' ? 'Expense' : 'Recurring';
      const title = item.title || item.name;
      const category = item.category || item.frequency;
      const amount = item.amount;
      const date = new Date(item.timestamp).toLocaleDateString('en-IN');
      const safeTitle = `"${title.toString().replace(/"/g, '""')}"`;
      const safeCategory = `"${category.toString().replace(/"/g, '""')}"`;
      return [type, safeTitle, safeCategory, amount, date].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (fullHistory.length === 0) return;
    
    // Create HTML table structure that Excel understands
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Financial History</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { background-color: #10b981; color: white; padding: 12px; border: 1px solid #ddd; text-align: left; }
          td { padding: 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Personal Expense Tracker - Financial Report</h2>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Title/Name</th>
              <th>Category/Frequency</th>
              <th>Amount (INR)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    fullHistory.forEach(item => {
      const type = item.type === 'expense' ? 'Expense' : 'Recurring';
      const title = item.title || item.name;
      const category = item.category || item.frequency;
      const amount = item.amount;
      const date = new Date(item.timestamp).toLocaleDateString('en-IN');
      
      html += `
        <tr>
          <td>${type}</td>
          <td>${title}</td>
          <td>${category}</td>
          <td>${amount}</td>
          <td>${date}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(exp =>
        exp.title.toLowerCase().includes(term) ||
        exp.category.toLowerCase().includes(term) ||
        exp.notes?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filterCategory !== 'All') {
      result = result.filter(exp => exp.category === filterCategory);
    }

    // Period filter
    const now = new Date();
    if (filterPeriod === 'today') {
      const today = now.toISOString().split('T')[0];
      result = result.filter(exp => exp.date === today);
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(exp => new Date(exp.date) >= weekAgo);
    } else if (filterPeriod === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(exp => new Date(exp.date) >= monthStart);
    } else if (filterPeriod === 'custom') {
      if (customStartDate) {
        result = result.filter(exp => exp.date >= customStartDate);
      }
      if (customEndDate) {
        result = result.filter(exp => exp.date <= customEndDate);
      }
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [expenses, searchTerm, filterCategory, filterPeriod]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = expenses.filter(exp => {
      const d = new Date(exp.date);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });

    const thisMonthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
    const lastMonthTotal = lastMonth.reduce((s, e) => s + e.amount, 0);

    // Calculate recurring commitment for the month
    const monthlyRecurringTotal = subscriptions.reduce((acc, sub) => {
      const amount = sub.amount;
      if (sub.frequency === 'yearly') return acc + (amount / 12);
      if (sub.frequency === 'weekly') return acc + (amount * 4);
      return acc + amount;
    }, 0);

    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const todayTotal = expenses
      .filter(e => e.date === now.toISOString().split('T')[0])
      .reduce((s, e) => s + e.amount, 0);

    const adjustedThisMonthTotal = thisMonthTotal + monthlyRecurringTotal;

    const percentChange = lastMonthTotal > 0
      ? ((adjustedThisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
      : 0;

    return {
      thisMonthTotal: adjustedThisMonthTotal,
      actualSpend: thisMonthTotal,
      recurringCommitment: monthlyRecurringTotal,
      lastMonthTotal,
      totalAll,
      todayTotal,
      percentChange,
      thisMonth
    };
  }, [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const totals = {};
    const data = filterPeriod === 'all' ? expenses : filteredExpenses;
    data.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });
    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: grandTotal > 0 ? (amount / grandTotal * 100).toFixed(1) : 0,
        ...getCategoryData(name)
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, filteredExpenses, filterPeriod]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="dashboard" id="dashboard-page">
      {/* Welcome */}
      <div className="container">
        <div className="dash-welcome animate-fadeInUp">
          <div>
            <h1 className="dash-welcome-title">
              Welcome back, <span className="accent-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="dash-welcome-sub">Here's your financial overview</p>
          </div>
          <div className="dash-actions-group">
            <div className="select-wrapper no-icon" style={{ minWidth: '160px' }}>
              <select 
                className="input-field filter-select" 
                style={{ paddingRight: '36px', height: '100%' }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'csv') exportToCSV();
                  if (val === 'excel') exportToExcel();
                  e.target.value = ''; // Reset
                }}
              >
                <option value="">Export Data...</option>
                <option value="csv">CSV File</option>
                <option value="excel">Excel Sheet</option>
              </select>
              <Download size={16} className="select-chevron" style={{ right: '12px', pointerEvents: 'none' }} />
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setShowHistory(true)}
              id="history-btn"
            >
              <History size={18} />
              History
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { resetForm(); setShowForm(true); }}
              id="add-expense-btn"
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card glass-card">
            <div className="stat-card-header">
              <span className="stat-card-label">This Month</span>
              <div className="stat-card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats.thisMonthTotal)}</div>
            <div className={`stat-card-change ${parseFloat(stats.percentChange) > 0 ? 'up' : 'down'}`}>
              {parseFloat(stats.percentChange) > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{Math.abs(stats.percentChange)}% vs last month</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Today</span>
              <div className="stat-card-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats.todayTotal)}</div>
            <div className="stat-card-sub">{expenses.filter(e => e.date === new Date().toISOString().split('T')[0]).length} transactions</div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Total Expenses</span>
              <div className="stat-card-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                <Wallet size={18} />
              </div>
            </div>
            <div className="stat-card-value">{formatCurrency(stats.totalAll)}</div>
            <div className="stat-card-sub">{expenses.length} total entries</div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-card-header">
              <span className="stat-card-label">Avg / Day (Month)</span>
              <div className="stat-card-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                <PieChart size={18} />
              </div>
            </div>
            <div className="stat-card-value">
              {formatCurrency(stats.thisMonth.length > 0 ? stats.thisMonthTotal / new Date().getDate() : 0)}
            </div>
            <div className="stat-card-sub">daily average</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dash-grid animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {/* Expenses List */}
          <div className="dash-main">
            {/* Filters */}
            <div className="dash-filters glass-card" style={{ flexWrap: 'wrap' }}>
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="input-field search-input"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  id="search-expenses"
                />
              </div>
              <div className="filter-group" style={{ flexWrap: 'wrap' }}>
                <div className="select-wrapper">
                  <Filter size={14} className="select-icon" />
                  <select
                    className="input-field filter-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    id="filter-category"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="select-wrapper">
                  <Calendar size={14} className="select-icon" />
                  <select
                    className="input-field filter-select"
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    id="filter-period"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                {filterPeriod === 'custom' && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }} 
                      value={customStartDate} 
                      onChange={e => setCustomStartDate(e.target.value)} 
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>to</span>
                    <input 
                      type="date" 
                      className="input-field" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem', width: 'auto' }} 
                      value={customEndDate} 
                      onChange={e => setCustomEndDate(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Expense Items */}
            <div className="expense-list" id="expense-list">
              {filteredExpenses.length === 0 ? (
                <div className="empty-state glass-card">
                  <Wallet size={48} className="empty-icon" />
                  <h3>No expenses found</h3>
                  <p>{expenses.length === 0
                    ? 'Start tracking by adding your first expense!'
                    : 'Try adjusting your filters or search term.'
                  }</p>
                  {expenses.length === 0 && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)} id="empty-add-btn">
                      <Plus size={18} />
                      Add First Expense
                    </button>
                  )}
                </div>
              ) : (
                filteredExpenses.map((expense) => {
                  const cat = getCategoryData(expense.category);
                  const CatIcon = cat.icon;
                  return (
                    <div key={expense.id} className="expense-item glass-card" id={`expense-${expense.id}`}>
                      <div className="expense-item-left">
                        <div className="expense-cat-icon" style={{ background: `${cat.color}15`, color: cat.color }}>
                          <CatIcon size={20} />
                        </div>
                        <div className="expense-info">
                          <h4 className="expense-title">{expense.title}</h4>
                          <div className="expense-meta">
                            <span className="expense-category-tag" style={{ color: cat.color, background: `${cat.color}12` }}>
                              {expense.category}
                            </span>
                            <span className="expense-date">{formatDate(expense.date)}</span>
                          </div>
                          {expense.notes && <p className="expense-notes">{expense.notes}</p>}
                        </div>
                      </div>
                      <div className="expense-item-right">
                        <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                        <div className="expense-actions">
                          <button
                            className="btn-icon action-edit"
                            onClick={() => handleEdit(expense)}
                            aria-label="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="btn-icon action-delete"
                            onClick={() => requestDelete(expense.id, 'expense', expense.title)}
                            aria-label="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar – Category Breakdown */}
          <div className="dash-sidebar">
            <div className="category-card glass-card">
              <h3 className="sidebar-title">Category Breakdown</h3>
              {categoryBreakdown.length === 0 ? (
                <p className="sidebar-empty">No data yet</p>
              ) : (
                <div className="category-list">
                  {categoryBreakdown.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.name} className="category-item">
                        <div className="category-item-left">
                          <div className="category-icon-sm" style={{ background: `${cat.color}15`, color: cat.color }}>
                            <CatIcon size={16} />
                          </div>
                          <div>
                            <div className="category-name">{cat.name}</div>
                            <div className="category-amount">{formatCurrency(cat.amount)}</div>
                          </div>
                        </div>
                        <div className="category-percent">{cat.percent}%</div>
                      </div>
                    );
                  })}
                  {/* Visual bars */}
                  <div className="category-bars">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.name} className="bar-row">
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${cat.percent}%`, background: cat.color }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Payments Section */}
            <div className="recurring-card glass-card">
              <div className="sidebar-header-row">
                <h3 className="sidebar-title">Recurring</h3>
                <button className="btn-icon-sm" onClick={() => setShowRecurringForm(true)} title="Manage Recurring">
                  <Repeat size={14} />
                </button>
              </div>

              <div className="recurring-summary-small">
                {subscriptions.length === 0 ? (
                  <p className="sidebar-empty">No active subscriptions</p>
                ) : (
                  <div className="mini-sub-list">
                    {subscriptions.slice(0, 3).map(sub => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const next = new Date(sub.nextDate);
                      next.setHours(0, 0, 0, 0);
                      if (next < today) next.setMonth(next.getMonth() + 1);
                      const daysLeft = Math.ceil((next - today) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={sub.id} className="mini-sub-item">
                          <div className="mini-sub-info">
                            <span className="mini-sub-name">{sub.name}</span>
                            <span className={`mini-sub-days ${daysLeft <= 5 ? 'due' : ''}`}>
                              {daysLeft}d left
                            </span>
                          </div>
                          <div className="mini-sub-amount">{formatCurrency(sub.amount)}</div>
                        </div>
                      );
                    })}
                    {subscriptions.length > 3 && (
                      <button className="view-all-link" onClick={() => setShowRecurringForm(true)}>
                        + {subscriptions.length - 3} more payments
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-card glass-card">
              <h3 className="sidebar-title">Recent Activity</h3>
              {expenses.slice(0, 3).map((exp) => {
                const cat = getCategoryData(exp.category);
                return (
                  <div key={exp.id} className="recent-item">
                    <div className="recent-dot" style={{ background: cat.color }}></div>
                    <div className="recent-info">
                      <span className="recent-name">{exp.title}</span>
                      <span className="recent-date">{formatDate(exp.date)}</span>
                    </div>
                    <span className="recent-amount">{formatCurrency(exp.amount)}</span>
                  </div>
                );
              })}
              {expenses.length === 0 && <p className="sidebar-empty">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm} id="expense-modal-overlay">
          <div className="modal glass-card animate-fadeInUp" onClick={(e) => e.stopPropagation()} id="expense-modal">
            <div className="modal-header">
              <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button className="btn-icon" onClick={resetForm} id="modal-close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form" id="expense-form">
              <div className="input-group">
                <label htmlFor="expense-title">Title</label>
                <input
                  type="text"
                  id="expense-title"
                  className="input-field"
                  placeholder="e.g., Grocery Shopping"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-row">
                <div className="input-group">
                  <label htmlFor="expense-amount">Amount (₹)</label>
                  <input
                    type="number"
                    id="expense-amount"
                    className="input-field"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="expense-date">Date</label>
                  <input
                    type="date"
                    id="expense-date"
                    className="input-field"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="expense-category">Category</label>
                <select
                  id="expense-category"
                  className="input-field"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="expense-notes">Notes (optional)</label>
                <textarea
                  id="expense-notes"
                  className="input-field modal-textarea"
                  placeholder="Add any notes..."
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="expense-submit">
                  <Check size={18} />
                  {editingId ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Management Modal */}
      {showRecurringForm && (
        <div className="modal-overlay" onClick={() => { setShowRecurringForm(false); resetRecurringForm(); }}>
          <div className="modal glass-card animate-fadeInUp" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-header-with-icon">
                <Repeat size={20} className="accent-text" />
                <h2>Manage Recurring Payments</h2>
              </div>
              <button className="btn-icon" onClick={() => { setShowRecurringForm(false); resetRecurringForm(); }}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div className="sub-manager-list">
                {subscriptions.length === 0 ? (
                  <p className="sidebar-empty">No active subscriptions. Add one below.</p>
                ) : (
                  subscriptions.map(sub => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const next = new Date(sub.nextDate);
                    next.setHours(0, 0, 0, 0);
                    if (next < today) {
                      if (sub.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
                      else if (sub.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
                      else if (sub.frequency === 'weekly') next.setDate(next.getDate() + 7);
                      else next.setMonth(next.getMonth() + 1);
                    }
                    const formattedNextDate = next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    
                    return (
                      <div key={sub.id} className="sub-manager-item">
                        <div className="sub-manager-info">
                          <strong>{sub.name}</strong>
                          <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span>{formatCurrency(sub.amount)} / {sub.frequency}</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>Next: {formattedNextDate}</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn-icon-sm action-edit"
                            onClick={() => {
                              setEditingRecurringId(sub.id);
                              document.getElementById('new-sub-name').value = sub.name;
                              document.getElementById('new-sub-amount').value = sub.amount;
                              document.getElementById('new-sub-freq').value = sub.frequency;
                              document.getElementById('new-sub-date').value = sub.nextDate ? sub.nextDate.split('T')[0] : new Date().toISOString().split('T')[0];
                            }}
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn-icon-sm action-delete"
                            onClick={() => requestDelete(sub.id, 'recurring', sub.name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="sub-add-form">
                <h4>{editingRecurringId ? 'Edit Recurring Payment' : 'Add New Recurring'}</h4>
                <div className="modal-row">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Netflix"
                    id="new-sub-name"
                  />
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Amount"
                    id="new-sub-amount"
                  />
                </div>
                <div className="modal-row">
                  <select className="input-field" id="new-sub-freq">
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <input
                    type="date"
                    className="input-field"
                    id="new-sub-date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                  <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        const name = document.getElementById('new-sub-name').value;
                        const amount = document.getElementById('new-sub-amount').value;
                        const freq = document.getElementById('new-sub-freq').value;
                        const customDate = document.getElementById('new-sub-date').value;
                        if (!name || !amount) return;

                        const nextDate = customDate || new Date().toISOString().split('T')[0];
                        
                        if (editingRecurringId) {
                          const { data, error } = await supabase
                            .from('recurring')
                            .update({
                              name,
                              amount: parseFloat(amount),
                              frequency: freq,
                              next_date: nextDate
                            })
                            .eq('id', editingRecurringId)
                            .select()
                            .single();

                          if (!error && data) {
                            setSubscriptions(prev => prev.map(s => s.id === editingRecurringId ? { ...data, nextDate: data.next_date } : s));
                            resetRecurringForm();
                          }
                        } else {
                          const { data, error } = await supabase
                            .from('recurring')
                            .insert({
                              user_id: user.id,
                              name,
                              amount: parseFloat(amount),
                              frequency: freq,
                              next_date: nextDate
                            })
                            .select()
                            .single();

                          if (!error && data) {
                            setSubscriptions(prev => [...prev, { ...data, nextDate: data.next_date }]);
                            resetRecurringForm();
                          }
                        }
                      }}
                    >
                      {editingRecurringId ? 'Update' : 'Add'}
                    </button>
                    {editingRecurringId && (
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={resetRecurringForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal glass-card animate-fadeInUp" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '16px' }}>
              <h2>Expense & Recurring History</h2>
              <button className="btn-icon" onClick={() => setShowHistory(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="history-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', gap: '12px', flexWrap: 'wrap' }}>
              <div className="select-wrapper">
                <Calendar size={14} className="select-icon" />
                <select 
                  className="input-field filter-select" 
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  style={{ minWidth: '160px' }}
                >
                  <option value="all">All Time</option>
                  {historyMonths.map(m => {
                    const [year, month] = m.split('-');
                    const date = new Date(year, parseInt(month) - 1);
                    const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                    return <option key={m} value={m}>{label}</option>;
                  })}
                </select>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Expense</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {formatCurrency(historyTotal)}
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: '50vh', overflowY: 'auto', paddingRight: '8px' }}>
              {filteredHistory.length === 0 ? (
                <p className="sidebar-empty">No history found for this period.</p>
              ) : (
                <div className="recent-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredHistory.map((item) => {
                    const isExp = item.type === 'expense';
                    const cat = getCategoryData(isExp ? item.category : 'Other');
                    return (
                      <div key={`${item.type}-${item.id}`} className="expense-item glass-card" style={{ padding: '12px 16px', margin: 0 }}>
                        <div className="expense-item-left">
                          <div className="expense-cat-icon" style={{ background: `${cat.color}15`, color: cat.color, width: 36, height: 36, minWidth: 36 }}>
                            {isExp ? <cat.icon size={16} /> : <Repeat size={16} />}
                          </div>
                          <div className="expense-info">
                            <h4 className="expense-title">{isExp ? item.title : item.name}</h4>
                            <div className="expense-meta">
                              <span className="expense-category-tag" style={{ color: cat.color, background: `${cat.color}12` }}>
                                {isExp ? item.category : `Recurring (${item.frequency})`}
                              </span>
                              <span className="expense-date">
                                Added: {new Date(item.timestamp).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="expense-item-right">
                          <span className="expense-amount">{formatCurrency(item.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete.show && (
        <div className="modal-overlay" onClick={() => setConfirmDelete({ show: false, id: null, type: null, title: '' })}>
          <div className="modal glass-card animate-fadeInUp" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger-soft)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Confirm Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Are you sure you want to delete <strong>{confirmDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete({ show: false, id: null, type: null, title: '' })} style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={async () => {
                  if (confirmDelete.type === 'expense') {
                    const { error } = await supabase.from('expenses').delete().eq('id', confirmDelete.id);
                    if (!error) setExpenses(prev => prev.filter(exp => exp.id !== confirmDelete.id));
                  } else if (confirmDelete.type === 'recurring') {
                    const { error } = await supabase.from('recurring').delete().eq('id', confirmDelete.id);
                    if (!error) setSubscriptions(prev => prev.filter(s => s.id !== confirmDelete.id));
                  }
                  setConfirmDelete({ show: false, id: null, type: null, title: '' });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
