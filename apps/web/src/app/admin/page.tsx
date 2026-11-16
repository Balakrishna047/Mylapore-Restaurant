'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ChefHat,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  X,
  Save,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { MenuItemDto } from '@mylapore/shared-types';

interface KitchenTicket {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  deliverySlot: string;
  notes?: string;
  items: string[];
}

interface AdminDashboardData {
  totalRevenue?: number;
  activeKitchenCount?: number;
  readyDeliveryCount?: number;
  outOfStockItems?: number;
  activeKitchenOrders?: KitchenTicket[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  payload?: string;
  createdAt: string;
}

export default function AdminKdsPage() {
  const { user, login, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'KDS' | 'MENU' | 'AUDIT'>('KDS');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dishes, setDishes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Auth form states
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Menu Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Inline Quick Price Edit State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any | null>(null);

  // New Dish Form State
  const [dishForm, setDishForm] = useState({
    name: '',
    categoryId: '',
    basePrice: '',
    image: '',
    description: '',
    spiceLevel: 'MEDIUM',
    dietaryTags: ['VEGETARIAN'],
    allergens: '',
    ingredients: '',
    reheatingInstructions: 'Refrigerate at <=40°F (4°C). Reheat thoroughly to 165°F before consuming.',
    isBlastChilled: true
  });

  const isStaff = user && ['SUPER_ADMIN', 'RESTAURANT_ADMIN', 'KITCHEN_MANAGER'].includes(user.role);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, items, cats] = await Promise.all([
        api.getAdminDashboard().catch(() => null),
        api.getMenuItems(),
        api.getCategories().catch(() => [])
      ]);
      if (dash) setDashboard(dash);
      setDishes(items || []);
      setCategories(cats || []);

      if (user?.role === 'SUPER_ADMIN') {
        const logs = await api.getAuditLogs().catch(() => []);
        setAuditLogs(logs || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      toast.error('Sync Notice', err.message || 'Could not refresh data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (isStaff) loadData();
    }, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleStaffLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setAuthLoading(true);
      await login(staffEmail, staffPassword);
      toast.success('Staff Authenticated', 'Welcome to Restaurant Operations.');
    } catch (err: any) {
      toast.error('Authentication Failed', err.message || 'Invalid staff credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: 'SUPER_ADMIN' | 'KITCHEN_MANAGER') => {
    try {
      setAuthLoading(true);
      const email = role === 'SUPER_ADMIN' ? 'admin@mylaporeexpress.com' : 'kitchen@mylaporeexpress.com';
      await login(email, 'Password123!');
      toast.success(`Logged In as ${role}`, 'Full operational access granted.');
    } catch (err: any) {
      toast.error('Login Failed', err.message || 'Could not authenticate demo user');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    let nextStatus = 'ACCEPTED';
    if (currentStatus === 'CONFIRMED') nextStatus = 'ACCEPTED';
    else if (currentStatus === 'ACCEPTED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';

    setAdvancingId(orderId);
    try {
      await api.advanceOrderStatus(orderId, nextStatus, `Staff advanced to ${nextStatus}`);
      toast.success('Ticket Advanced', `Order moved to ${nextStatus}`);
      await loadData();
    } catch (err: any) {
      toast.error('Status Update Failed', err.message || 'Could not advance order');
    } finally {
      setAdvancingId(null);
    }
  };

  const handleToggleStock = async (itemId: string, currentStock: boolean) => {
    try {
      await api.toggleStock(itemId);
      toast.info(
        currentStock ? 'Dish 86\'d' : 'Dish Restocked',
        'Live availability updated across storefront and concierge.'
      );
      await loadData();
    } catch (err: any) {
      toast.error('Stock Toggle Failed', err.message || 'Could not update stock status');
    }
  };

  // Quick Inline Price Save
  const handleQuickPriceSave = async (dishId: string) => {
    const num = parseFloat(tempPrice);
    if (isNaN(num) || num <= 0) {
      toast.error('Invalid Price', 'Please enter a valid dollar amount.');
      return;
    }
    try {
      setIsSavingPrice(true);
      await api.updateMenuItem(dishId, { basePrice: num });
      toast.success('Price Updated', `Dish price updated to $${num.toFixed(2)}.`);
      setEditingPriceId(null);
      await loadData();
    } catch (err: any) {
      toast.error('Price Update Failed', err.message || 'Failed to update price');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (dish: any) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name || '',
      categoryId: dish.categoryId || categories[0]?.id || '',
      basePrice: String(dish.basePrice || ''),
      image: dish.image || '',
      description: dish.description || '',
      spiceLevel: dish.spiceLevel || 'MEDIUM',
      dietaryTags: Array.isArray(dish.dietaryTags) ? dish.dietaryTags : ['VEGETARIAN'],
      allergens: Array.isArray(dish.allergens) ? dish.allergens.join(', ') : '',
      ingredients: Array.isArray(dish.ingredients) ? dish.ingredients.join(', ') : '',
      reheatingInstructions: dish.reheatingInstructions || 'Refrigerate at <=40°F (4°C). Reheat thoroughly to 165°F before consuming.',
      isBlastChilled: dish.isBlastChilled ?? true
    });
    setIsEditModalOpen(true);
  };

  // Save Dish Changes
  const handleSaveDishChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish) return;
    try {
      const payload: any = {
        name: dishForm.name,
        basePrice: parseFloat(dishForm.basePrice),
        image: dishForm.image,
        description: dishForm.description,
        categoryId: dishForm.categoryId,
        spiceLevel: dishForm.spiceLevel,
        dietaryTags: dishForm.dietaryTags,
        allergens: dishForm.allergens.split(',').map((s) => s.trim()).filter(Boolean),
        ingredients: dishForm.ingredients.split(',').map((s) => s.trim()).filter(Boolean),
        reheatingInstructions: dishForm.reheatingInstructions,
        isBlastChilled: dishForm.isBlastChilled
      };
      await api.updateMenuItem(editingDish.id, payload);
      toast.success('Dish Updated', `${dishForm.name} details saved to database.`);
      setIsEditModalOpen(false);
      setEditingDish(null);
      await loadData();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not update dish');
    }
  };

  // Create New Dish
  const handleCreateNewDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!dishForm.name || !dishForm.basePrice || !dishForm.image) {
        toast.error('Missing Fields', 'Dish name, price, and image URL are required.');
        return;
      }
      const targetCatId = dishForm.categoryId || categories[0]?.id;
      if (!targetCatId) {
        toast.error('Category Required', 'Please select a valid menu category.');
        return;
      }
      const payload: any = {
        name: dishForm.name,
        basePrice: parseFloat(dishForm.basePrice),
        image: dishForm.image,
        description: dishForm.description,
        categoryId: targetCatId,
        spiceLevel: dishForm.spiceLevel,
        dietaryTags: dishForm.dietaryTags,
        allergens: dishForm.allergens.split(',').map((s) => s.trim()).filter(Boolean),
        ingredients: dishForm.ingredients.split(',').map((s) => s.trim()).filter(Boolean),
        reheatingInstructions: dishForm.reheatingInstructions,
        isBlastChilled: dishForm.isBlastChilled
      };
      await api.createMenuItem(payload);
      toast.success('Dish Created', `${dishForm.name} successfully published to catalog.`);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err.message || 'Could not create dish');
    }
  };

  // Delete / Archive Dish
  const handleDeleteDish = async (dishId: string, dishName: string) => {
    if (!confirm(`Are you sure you want to delete or archive "${dishName}"?`)) return;
    try {
      const res = await api.deleteMenuItem(dishId);
      toast.info('Catalog Updated', res.message || 'Dish removed from menu.');
      await loadData();
    } catch (err: any) {
      toast.error('Action Failed', err.message || 'Could not delete dish');
    }
  };

  // Filter Dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch =
      !searchQuery ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      dish.category?.slug === selectedCategory ||
      dish.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 transition-colors duration-200">
      <div className="max-w-7xl 3xl:max-w-ultrawide mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header with Title and Staff Identity */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-amber-200/90 shadow-xs">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 flex items-center gap-2.5">
              <ChefHat className="w-8 h-8 text-primary" />
              <span>Mylapore Restaurant Operations & Catalog</span>
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              Live preparation queue, dynamic dish pricing, image management, and blast-chilling catalog controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isStaff ? (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-300/80">
                <div className="text-right">
                  <span className="block text-xs font-bold text-stone-900">{user?.name}</span>
                  <Badge variant="accent" size="sm">
                    {user?.role}
                  </Badge>
                </div>
                <Button
                  onClick={logout}
                  variant="secondary"
                  size="sm"
                  className="text-xs text-stone-600 hover:text-stone-900"
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <Badge variant="destructive" size="sm" className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Unauthenticated
              </Badge>
            )}

            <Button
              onClick={loadData}
              variant="secondary"
              size="sm"
              isLoading={loading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Staff Authentication Banner (if not logged in) */}
        {!isStaff && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-primary/30 shadow-md space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 rounded-2xl text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Staff Authentication Required
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  To update dish prices, add new items, modify blast-chilled tags, or advance kitchen tickets, please sign in with an authorized staff account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Quick Demo One-Click Sign In */}
              <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-amber-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  ⚡ Quick Demo Access
                </h4>
                <p className="text-xs text-stone-600">
                  One-click sign-in for testing admin capabilities and price editing:
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button
                    onClick={() => handleQuickDemoLogin('SUPER_ADMIN')}
                    isLoading={authLoading}
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                  >
                    Login as Super Admin (Sundaram)
                  </Button>
                  <Button
                    onClick={() => handleQuickDemoLogin('KITCHEN_MANAGER')}
                    isLoading={authLoading}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                  >
                    Login as Kitchen Manager
                  </Button>
                </div>
              </div>

              {/* Standard Staff Credentials Form */}
              <form onSubmit={handleStaffLogin} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Staff Email
                    </label>
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="admin@mylaporeexpress.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  isLoading={authLoading}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs font-bold"
                >
                  Sign In with Staff Account
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-amber-200/90 pb-3">
          <button
            onClick={() => setActiveTab('KDS')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'KDS'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>🔥 Kitchen Orders (KDS)</span>
            {dashboard?.activeKitchenCount ? (
              <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {dashboard.activeKitchenCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('MENU')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'MENU'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>📋 Menu, Pricing & Catalog ({dishes.length})</span>
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'AUDIT'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📜 Audit Logs ({auditLogs.length})</span>
            </button>
          )}
        </div>

        {/* TAB 1: KITCHEN DISPLAY SYSTEM (KDS) */}
        {activeTab === 'KDS' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  Total GMV Revenue
                </span>
                <p className="font-serif font-bold text-xl sm:text-2xl text-emerald-700 mt-1">
                  ${dashboard?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  Active Kitchen Tickets
                </span>
                <p className="font-serif font-bold text-xl sm:text-2xl text-primary mt-1">
                  {dashboard?.activeKitchenCount ?? 0}
                </p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  Ready for Dispatch
                </span>
                <p className="font-serif font-bold text-xl sm:text-2xl text-amber-700 mt-1">
                  {dashboard?.readyDeliveryCount ?? 0}
                </p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold uppercase text-stone-500 tracking-wider">
                  Out of Stock Dishes (86)
                </span>
                <p className="font-serif font-bold text-xl sm:text-2xl text-stone-600 mt-1">
                  {dashboard?.outOfStockItems ?? 0}
                </p>
              </div>
            </div>

            {/* Active Kitchen Queue */}
            <div className="space-y-4">
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <span>🔥 Live Preparation & Packaging Queue</span>
              </h2>

              {loading && !dashboard ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-44 bg-white rounded-2xl border border-amber-200 animate-pulse"
                    />
                  ))}
                </div>
              ) : dashboard?.activeKitchenOrders?.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-amber-200 text-center text-xs text-stone-500">
                  All kitchen tickets are currently prepared and dispatched!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboard?.activeKitchenOrders?.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-2xl border border-amber-200 shadow-2xs p-5 flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-serif font-bold text-base text-stone-900">
                              {ticket.orderNumber}
                            </h4>
                            <span className="text-xs text-stone-500">{ticket.customerName}</span>
                          </div>
                          <Badge variant="accent" size="sm">
                            {ticket.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-stone-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 space-y-1">
                          <p className="font-semibold">Slot: {ticket.deliverySlot}</p>
                          {ticket.notes && (
                            <p className="italic text-[11px] text-primary">Note: &quot;{ticket.notes}&quot;</p>
                          )}
                        </div>

                        <div className="space-y-1 text-xs">
                          {ticket.items.map((line, idx) => (
                            <div key={idx} className="font-medium text-stone-800">
                              • {line}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAdvanceStatus(ticket.id, ticket.status)}
                        isLoading={advancingId === ticket.id}
                        variant="primary"
                        className="w-full text-xs font-bold"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {ticket.status === 'CONFIRMED'
                          ? 'Accept Ticket'
                          : ticket.status === 'ACCEPTED'
                          ? 'Start Cooking & Blast Chill'
                          : ticket.status === 'PREPARING'
                          ? 'Mark Packed & Ready'
                          : 'Dispatch to Driver'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MENU, PRICING & CATALOG MANAGER */}
        {activeTab === 'MENU' && (
          <div className="space-y-6">
            {/* Filter and Add Dish Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes or ingredients..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-stone-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs py-2 px-3 rounded-xl border border-stone-200 bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="ALL">All Categories ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={() => {
                  setDishForm({
                    name: '',
                    categoryId: categories[0]?.id || '',
                    basePrice: '',
                    image: '',
                    description: '',
                    spiceLevel: 'MEDIUM',
                    dietaryTags: ['VEGETARIAN'],
                    allergens: '',
                    ingredients: '',
                    reheatingInstructions: 'Refrigerate at <=40°F (4°C). Reheat thoroughly to 165°F before consuming.',
                    isBlastChilled: true
                  });
                  setIsAddModalOpen(true);
                }}
                variant="primary"
                size="sm"
                className="text-xs font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                + Add New Dish
              </Button>
            </div>

            {/* Dishes Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => {
                const isEditingThisPrice = editingPriceId === dish.id;

                return (
                  <div
                    key={dish.id}
                    className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div>
                      {/* Dish Photo and Header */}
                      <div className="flex items-start gap-3">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-16 h-16 rounded-xl object-cover border border-amber-200 shrink-0 bg-amber-50"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-dish.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              {dish.category?.name || 'South Indian'}
                            </span>
                            <Badge
                              variant={dish.isAvailable ? 'success' : 'destructive'}
                              size="sm"
                            >
                              {dish.isAvailable ? 'In Stock' : '86\'d'}
                            </Badge>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-stone-900 truncate mt-0.5">
                            {dish.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {dish.description}
                          </p>
                        </div>
                      </div>

                      {/* Dietary Badges */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {Array.isArray(dish.dietaryTags) &&
                          dish.dietaryTags.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {tag}
                            </span>
                          ))}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          🌶️ {dish.spiceLevel || 'MEDIUM'}
                        </span>
                        {dish.isBlastChilled && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            ❄️ Blast-Chilled
                          </span>
                        )}
                      </div>

                      {/* Quick Inline Price Editor */}
                      <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] border border-amber-200 flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-600">Price:</span>

                        {isEditingThisPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-800">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-primary bg-white focus:outline-none"
                              autoFocus
                            />
                            <Button
                              onClick={() => handleQuickPriceSave(dish.id)}
                              isLoading={isSavingPrice}
                              size="sm"
                              variant="primary"
                              className="px-2 py-1 text-xs"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => setEditingPriceId(null)}
                              size="sm"
                              variant="secondary"
                              className="px-2 py-1 text-xs"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base text-primary">
                              ${dish.basePrice?.toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPriceId(dish.id);
                                setTempPrice(String(dish.basePrice || ''));
                              }}
                              className="p-1 rounded-lg text-stone-500 hover:text-primary hover:bg-amber-100 transition-colors"
                              title="Edit Price"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-amber-100">
                      <Button
                        onClick={() => handleToggleStock(dish.id, dish.isAvailable)}
                        variant={dish.isAvailable ? 'secondary' : 'destructive'}
                        size="sm"
                        className="text-[11px] font-bold"
                      >
                        {dish.isAvailable ? '86 Dish' : 'Restock'}
                      </Button>

                      <Button
                        onClick={() => openEditModal(dish)}
                        variant="secondary"
                        size="sm"
                        className="text-[11px] font-bold text-stone-800 hover:text-primary"
                        leftIcon={<Edit3 className="w-3 h-3" />}
                      >
                        Details
                      </Button>

                      <Button
                        onClick={() => handleDeleteDish(dish.id, dish.name)}
                        variant="destructive"
                        size="sm"
                        className="text-[11px] font-bold"
                        leftIcon={<Trash2 className="w-3 h-3" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: IMMUTABLE AUDIT LOGS */}
        {activeTab === 'AUDIT' && user?.role === 'SUPER_ADMIN' && (
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-2xs space-y-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>System Audit Logs & Operational History</span>
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Cryptographic trail recording price updates, 86 dish toggles, and catalog mutations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-200 text-stone-500">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7F2]">
                      <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-primary">{log.action}</td>
                      <td className="py-2.5 px-3 text-stone-700">{log.entity}</td>
                      <td className="py-2.5 px-3 text-stone-600 font-mono text-[11px] truncate max-w-md">
                        {log.payload}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT DISH MODAL */}
        {isEditModalOpen && editingDish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-amber-300 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <span>Edit Dish: {editingDish.name}</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDishChanges} className="space-y-4 text-xs">
                {/* Name & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Dish Name</label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2] focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Base Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dishForm.basePrice}
                      onChange={(e) => setDishForm({ ...dishForm, basePrice: e.target.value })}
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2] focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Category & Spice Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Category</label>
                    <select
                      value={dishForm.categoryId}
                      onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Spice Level</label>
                    <select
                      value={dishForm.spiceLevel}
                      onChange={(e) => setDishForm({ ...dishForm, spiceLevel: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    >
                      <option value="MILD">MILD</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HOT">HOT</option>
                      <option value="EXTRA_HOT">EXTRA_HOT</option>
                    </select>
                  </div>
                </div>

                {/* Image URL with live preview */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Image URL (Cloudinary / CDN)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={dishForm.image}
                      onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                      required
                      className="flex-1 p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                    {dishForm.image && (
                      <img
                        src={dishForm.image}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-amber-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-dish.svg';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={dishForm.description}
                    onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                  />
                </div>

                {/* Dietary Tags Checkboxes */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dietary Tags</label>
                  <div className="flex flex-wrap gap-3">
                    {['VEGETARIAN', 'VEGAN', 'JAIN', 'GLUTEN_FREE'].map((tag) => (
                      <label key={tag} className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={dishForm.dietaryTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDishForm({
                                ...dishForm,
                                dietaryTags: [...dishForm.dietaryTags, tag]
                              });
                            } else {
                              setDishForm({
                                ...dishForm,
                                dietaryTags: dishForm.dietaryTags.filter((t) => t !== tag)
                              });
                            }
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Allergens & Ingredients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Allergens (comma separated)</label>
                    <input
                      type="text"
                      value={dishForm.allergens}
                      onChange={(e) => setDishForm({ ...dishForm, allergens: e.target.value })}
                      placeholder="Milk, Nuts, Sesame"
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Ingredients (comma separated)</label>
                    <input
                      type="text"
                      value={dishForm.ingredients}
                      onChange={(e) => setDishForm({ ...dishForm, ingredients: e.target.value })}
                      placeholder="Toor Dal, Tamarind, Ghee"
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                  </div>
                </div>

                {/* Blast Chilled Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="blastChillToggle"
                    checked={dishForm.isBlastChilled}
                    onChange={(e) => setDishForm({ ...dishForm, isBlastChilled: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="blastChillToggle" className="font-bold text-stone-700 cursor-pointer">
                    ❄️ Preserved with Blast-Chilled Freshness Technology
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-amber-200">
                  <Button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="font-bold">
                    Save Changes to Menu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD NEW DISH MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-amber-300 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Publish New Dish to Catalog</span>
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewDish} className="space-y-4 text-xs">
                {/* Name & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Dish Name *</label>
                    <input
                      type="text"
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      placeholder="e.g. Traditional Mor Kuzhambu"
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2] focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Base Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dishForm.basePrice}
                      onChange={(e) => setDishForm({ ...dishForm, basePrice: e.target.value })}
                      placeholder="11.99"
                      required
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2] focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Category & Spice Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Category *</label>
                    <select
                      value={dishForm.categoryId}
                      onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Spice Level</label>
                    <select
                      value={dishForm.spiceLevel}
                      onChange={(e) => setDishForm({ ...dishForm, spiceLevel: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    >
                      <option value="MILD">MILD</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HOT">HOT</option>
                      <option value="EXTRA_HOT">EXTRA_HOT</option>
                    </select>
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dish Image URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={dishForm.image}
                      onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                      placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                      required
                      className="flex-1 p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                    {dishForm.image && (
                      <img
                        src={dishForm.image}
                        alt="Preview"
                        className="w-10 h-10 rounded-lg object-cover border border-amber-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-dish.svg';
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={dishForm.description}
                    onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                    placeholder="Slow-simmered yogurt curry with white pumpkin, tempered with mustard and curry leaves."
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                  />
                </div>

                {/* Dietary Tags Checkboxes */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dietary Tags</label>
                  <div className="flex flex-wrap gap-3">
                    {['VEGETARIAN', 'VEGAN', 'JAIN', 'GLUTEN_FREE'].map((tag) => (
                      <label key={tag} className="flex items-center gap-1.5 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={dishForm.dietaryTags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDishForm({
                                ...dishForm,
                                dietaryTags: [...dishForm.dietaryTags, tag]
                              });
                            } else {
                              setDishForm({
                                ...dishForm,
                                dietaryTags: dishForm.dietaryTags.filter((t) => t !== tag)
                              });
                            }
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span>{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Allergens & Ingredients */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Allergens</label>
                    <input
                      type="text"
                      value={dishForm.allergens}
                      onChange={(e) => setDishForm({ ...dishForm, allergens: e.target.value })}
                      placeholder="Milk, Nuts"
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Ingredients</label>
                    <input
                      type="text"
                      value={dishForm.ingredients}
                      onChange={(e) => setDishForm({ ...dishForm, ingredients: e.target.value })}
                      placeholder="Ash Gourd, Curd, Coconut, Cumin"
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-[#FAF7F2]"
                    />
                  </div>
                </div>

                {/* Blast Chilled Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="newBlastChillToggle"
                    checked={dishForm.isBlastChilled}
                    onChange={(e) => setDishForm({ ...dishForm, isBlastChilled: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="newBlastChillToggle" className="font-bold text-stone-700 cursor-pointer">
                    ❄️ Preserved with Blast-Chilled Freshness Technology
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-amber-200">
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="font-bold">
                    + Publish Dish
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
