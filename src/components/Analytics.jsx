import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { BarChart2, TrendingUp, TrendingDown, PieChart, Calendar, ArrowRight, AlertCircle, ShoppingCart, Coffee, Car, Home, Zap, Heart, GraduationCap, Gamepad2, MoreHorizontal } from 'lucide-react';
import './Analytics.css';

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

export default function Analytics() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (!error && data) {
        setExpenses(data);
      }
    };
    fetchExpenses();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalThisMonth = currentMonth.reduce((s, e) => s + e.amount, 0);
    const avgDaily = currentMonth.length > 0 ? totalThisMonth / now.getDate() : 0;

    // Category breakdown for insights
    const categoryMap = {};
    currentMonth.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Last 7 days trend
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = expenses
        .filter(e => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0);
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayTotal,
        date: dateStr
      };
    }).reverse();

    return { totalThisMonth, avgDaily, topCategory, last7Days, currentMonth, categoryMap };
  }, [expenses]);

  const maxDaily = Math.max(...stats.last7Days.map(d => d.amount), 1);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="analytics-page">
      <div className="container">
        <div className="analytics-header animate-fadeInUp">
          <h1 className="analytics-title">Financial <span className="accent-text">Analytics</span></h1>
          <p className="analytics-subtitle">Deep dive into your spending patterns</p>
        </div>

        <div className="analytics-grid">
          {/* Summary Cards */}
          <div className="analytics-summary animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="ana-card glass-card">
              <div className="ana-card-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                <TrendingUp size={20} />
              </div>
              <div className="ana-card-info">
                <span>Monthly Spend</span>
                <h3>{formatCurrency(stats.totalThisMonth)}</h3>
              </div>
            </div>
            <div className="ana-card glass-card">
              <div className="ana-card-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>
                <Calendar size={20} />
              </div>
              <div className="ana-card-info">
                <span>Daily Average</span>
                <h3>{formatCurrency(stats.avgDaily)}</h3>
              </div>
            </div>
            <div className="ana-card glass-card">
              <div className="ana-card-icon" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}>
                <BarChart2 size={20} />
              </div>
              <div className="ana-card-info">
                <span>Top Category</span>
                <h3>{stats.topCategory[0]}</h3>
              </div>
            </div>
          </div>

          {/* Main Charts Row */}
          <div className="analytics-charts-row animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="chart-card glass-card">
              <div className="chart-header">
                <h3>Spending Trend (7 Days)</h3>
              </div>
              <div className="bar-chart-container">
                {stats.last7Days.map((day, i) => (
                  <div key={i} className="bar-column">
                    <div className="bar-wrapper">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${(day.amount / maxDaily) * 100}%` }}
                        title={formatCurrency(day.amount)}
                      >
                        {day.amount > 0 && <span className="bar-value">{formatCurrency(day.amount)}</span>}
                      </div>
                    </div>
                    <span className="bar-label">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card glass-card">
              <div className="chart-header">
                <h3>Category Insights</h3>
              </div>
              <div className="category-insights-list">
                {Object.entries(stats.categoryMap)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, amount], i) => {
                    const cat = CATEGORIES.find(c => c.name === name) || CATEGORIES[8];
                    return (
                      <div key={i} className="insight-item">
                        <div className="insight-left">
                          <div className="insight-icon" style={{ color: cat.color, background: `${cat.color}15` }}>
                            <cat.icon size={16} />
                          </div>
                          <span>{name}</span>
                        </div>
                        <div className="insight-right">
                          <span className="insight-amount">{formatCurrency(amount)}</span>
                          <span className="insight-percent">
                            {((amount / stats.totalThisMonth) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Smart Insights Section */}
          <div className="smart-insights-section animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className="glass-card smart-insights-card">
              <div className="smart-header">
                <AlertCircle size={20} className="smart-icon" />
                <h3>Smart Recommendations</h3>
              </div>
              <div className="smart-grid">
                <div className="smart-tip">
                  <div className="tip-bullet"></div>
                  <p>Your spending on <span className="text-bold">{stats.topCategory[0]}</span> is higher than last week. Consider tracking individual items in this category.</p>
                </div>
                <div className="smart-tip">
                  <div className="tip-bullet"></div>
                  <p>Daily average is <span className="text-bold">{formatCurrency(stats.avgDaily)}</span>. Try setting a daily limit of {formatCurrency(stats.avgDaily * 0.9)} to save 10% this month.</p>
                </div>
                <div className="smart-tip">
                  <div className="tip-bullet"></div>
                  <p>You have {expenses.length} transactions recorded. Keep up the consistent tracking!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
