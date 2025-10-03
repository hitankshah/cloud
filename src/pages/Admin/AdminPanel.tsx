import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  ChefHat,
  ClipboardList,
  Clock,
  Plus,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { supabase, Restaurant, MenuItem } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { OrderManagement } from '../OrderManagement';

interface ScheduleDraft {
  open_time: string;
  close_time: string;
  is_open: boolean;
  schedule_notes: string;
}

interface MenuDraft {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  is_available: boolean;
  is_vegetarian: boolean;
}

const emptyMenuDraft: MenuDraft = {
  name: '',
  description: '',
  price: '',
  category: '',
  image_url: '',
  is_available: true,
  is_vegetarian: false,
};

export const AdminPanel = () => {
  const { user, profile } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, ScheduleDraft>>({});
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState<Record<string, boolean>>({});
  const [menuSaving, setMenuSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<MenuDraft | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'menu' | 'orders'>('schedule');
  const [error, setError] = useState<string | null>(null);
  const [menuFeedback, setMenuFeedback] = useState<string | null>(null);

  const ownerId = profile?.role === 'restaurant_owner' ? (user?.id ?? profile.id) : null;

  useEffect(() => {
    if (ownerId) {
      fetchRestaurants(ownerId);
    }
  }, [ownerId]);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchMenuItems(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const fetchRestaurants = async (owner: string) => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', owner)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const list = data || [];
      setRestaurants(list);
      if (!selectedRestaurantId && list.length > 0) {
        setSelectedRestaurantId(list[0].id);
      }

      const draftMap: Record<string, ScheduleDraft> = {};
      list.forEach((restaurant) => {
        draftMap[restaurant.id] = {
          open_time: restaurant.open_time || '09:00',
          close_time: restaurant.close_time || '23:00',
          is_open: restaurant.is_open ?? true,
          schedule_notes: restaurant.schedule_notes || '',
        };
      });
      setScheduleDrafts(draftMap);
    } catch (err: any) {
      console.error('Error loading restaurants', err);
      setError(err.message || 'Failed to load restaurants');
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    setMenuLoading(true);
    setMenuFeedback(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;
      setMenuItems(data || []);
    } catch (err: any) {
      console.error('Error loading menu items', err);
      setMenuFeedback(err.message || 'Failed to load menu items');
    } finally {
      setMenuLoading(false);
    }
  };

  const currentScheduleDraft = useMemo(() => {
    if (!selectedRestaurantId) return null;
    return scheduleDrafts[selectedRestaurantId];
  }, [scheduleDrafts, selectedRestaurantId]);

  const handleScheduleChange = (restaurantId: string, key: keyof ScheduleDraft, value: string | boolean) => {
    setScheduleDrafts((prev) => ({
      ...prev,
      [restaurantId]: {
        ...prev[restaurantId],
        [key]: value,
      },
    }));
  };

  const saveSchedule = async (restaurantId: string) => {
    const draft = scheduleDrafts[restaurantId];
    if (!draft) return;

    setScheduleSaving((prev) => ({ ...prev, [restaurantId]: true }));
    try {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          open_time: draft.open_time,
          close_time: draft.close_time,
          is_open: draft.is_open,
          schedule_notes: draft.schedule_notes,
        })
        .eq('id', restaurantId);

      if (updateError) throw updateError;

      setRestaurants((prev) =>
        prev.map((restaurant) =>
          restaurant.id === restaurantId
            ? {
                ...restaurant,
                open_time: draft.open_time,
                close_time: draft.close_time,
                is_open: draft.is_open,
                schedule_notes: draft.schedule_notes,
              }
            : restaurant
        )
      );
    } catch (err: any) {
      console.error('Error updating schedule', err);
      setError(err.message || 'Failed to update schedule');
    } finally {
      setScheduleSaving((prev) => ({ ...prev, [restaurantId]: false }));
    }
  };

  // Removed unused handleMenuDraftChange

  const createMenuItem = async (restaurantId: string, draft: MenuDraft) => {
    setMenuSaving(true);
    setMenuFeedback(null);
    try {
      const { error: insertError } = await supabase.from('menu_items').insert({
        restaurant_id: restaurantId,
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        category: draft.category,
        image_url: draft.image_url,
        is_available: draft.is_available,
        is_vegetarian: draft.is_vegetarian,
      });

      if (insertError) throw insertError;
      setMenuFeedback('Menu item added successfully');
      fetchMenuItems(restaurantId);
    } catch (err: any) {
      console.error('Error creating menu item', err);
      setMenuFeedback(err.message || 'Failed to create menu item');
    } finally {
      setMenuSaving(false);
    }
  };

  const updateMenuItem = async (restaurantId: string, itemId: string, draft: MenuDraft) => {
    setMenuSaving(true);
    setMenuFeedback(null);
    try {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({
          name: draft.name,
          description: draft.description,
          price: Number(draft.price),
          category: draft.category,
          image_url: draft.image_url,
          is_available: draft.is_available,
          is_vegetarian: draft.is_vegetarian,
        })
        .eq('id', itemId);

      if (updateError) throw updateError;
      setMenuFeedback('Menu item updated successfully');
      fetchMenuItems(restaurantId);
    } catch (err: any) {
      console.error('Error updating menu item', err);
      setMenuFeedback(err.message || 'Failed to update menu item');
    } finally {
      setMenuSaving(false);
      setEditingItemId(null);
      setEditingDraft(null);
    }
  };

  const removeMenuItem = async (restaurantId: string, itemId: string) => {
    if (!confirm('Remove this menu item?')) return;
    setMenuSaving(true);
    setMenuFeedback(null);
    try {
      const { error: deleteError } = await supabase.from('menu_items').delete().eq('id', itemId);
      if (deleteError) throw deleteError;
      setMenuFeedback('Menu item removed');
      fetchMenuItems(restaurantId);
    } catch (err: any) {
      console.error('Error deleting menu item', err);
      setMenuFeedback(err.message || 'Failed to delete menu item');
    } finally {
      setMenuSaving(false);
    }
  };

  if (profile?.role !== 'restaurant_owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center max-w-xl">
          <ShieldCheck className="mx-auto text-emerald-500 mb-4" size={48} />
          <h2 className="text-2xl font-semibold text-gray-900">Restricted Area</h2>
          <p className="text-gray-600 mt-2">Only restaurant owners can access the Cloud Kitchen admin controls.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-emerald-500 uppercase tracking-wide text-xs font-semibold">Admin Command Center</p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Cloud Kitchen Operations</h1>
              <p className="text-gray-600 mt-2">
                Set service hours, curate menus, and manage live orders across your virtual brands.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-sm text-emerald-700">
              <p className="font-semibold">Active Restaurants</p>
              <p className="text-2xl font-bold">{restaurants.length}</p>
            </div>
          </div>
          {restaurants.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select brand</label>
              <select
                value={selectedRestaurantId ?? ''}
                onChange={(event) => setSelectedRestaurantId(event.target.value || null)}
                className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <nav className="flex flex-wrap">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 min-w-[160px] px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'schedule'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-emerald-600'
              }`}
            >
              <Clock className="inline-block mr-2" size={18} /> Service Hours
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex-1 min-w-[160px] px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'menu'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-emerald-600'
              }`}
            >
              <UtensilsCrossed className="inline-block mr-2" size={18} /> Menu Studio
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 min-w-[160px] px-6 py-4 font-semibold transition-colors border-b-2 ${
                activeTab === 'orders'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-emerald-600'
              }`}
            >
              <ClipboardList className="inline-block mr-2" size={18} /> Live Orders
            </button>
          </nav>

          <div className="p-8">
            {activeTab === 'schedule' && currentScheduleDraft && selectedRestaurantId && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <CalendarCheck className="mr-3 text-emerald-500" size={24} />
                    Operating Schedule
                  </h2>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-emerald-600"
                      checked={currentScheduleDraft.is_open}
                      onChange={(event) =>
                        handleScheduleChange(selectedRestaurantId, 'is_open', event.target.checked)
                      }
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {currentScheduleDraft.is_open ? 'Accepting orders' : 'Temporarily closed'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opens</label>
                    <input
                      type="time"
                      value={currentScheduleDraft.open_time}
                      onChange={(event) =>
                        handleScheduleChange(selectedRestaurantId, 'open_time', event.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Closes</label>
                    <input
                      type="time"
                      value={currentScheduleDraft.close_time}
                      onChange={(event) =>
                        handleScheduleChange(selectedRestaurantId, 'close_time', event.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service note</label>
                    <input
                      type="text"
                      value={currentScheduleDraft.schedule_notes}
                      onChange={(event) =>
                        handleScheduleChange(selectedRestaurantId, 'schedule_notes', event.target.value)
                      }
                      placeholder="e.g. Breakfast menu ends at 11 AM"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={() => saveSchedule(selectedRestaurantId)}
                  disabled={scheduleSaving[selectedRestaurantId]}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center w-max"
                >
                  {scheduleSaving[selectedRestaurantId] ? (
                    <>
                      <Clock className="animate-spin mr-2" size={18} /> Saving
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2" size={18} /> Save Schedule
                    </>
                  )}
                </button>
              </section>
            )}

            {activeTab === 'menu' && selectedRestaurantId && (
              <section className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                    <ChefHat className="mr-3 text-emerald-500" size={24} /> Brand Menu
                  </h2>
                  <p className="text-gray-600 max-w-3xl">
                    Build signature dishes for this brand. Toggle availability to instantly update the storefront
                    across the Cloud Kitchen experience.
                  </p>
                </div>

                <MenuComposer
                  draft={{ ...emptyMenuDraft }}
                  disabled={menuSaving}
                  onSubmit={(draft) => createMenuItem(selectedRestaurantId, draft)}
                />

                {menuFeedback && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
                    {menuFeedback}
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Current dishes</h3>
                    <span className="text-sm text-gray-500">{menuItems.length} items</span>
                  </div>
                  {menuLoading ? (
                    <div className="p-8 flex items-center justify-center text-gray-500">
                      <Clock className="animate-spin mr-3" size={20} /> Loading menu…
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No dishes yet. Add your first hero product above.</div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {menuItems.map((item) => {
                        const isEditing = editingItemId === item.id && editingDraft;
                        return (
                          <li key={item.id} className="p-6">
                            {isEditing ? (
                              <MenuComposer
                                draft={editingDraft!}
                                disabled={menuSaving}
                                submitLabel="Save changes"
                                onSubmit={(draft) => updateMenuItem(selectedRestaurantId, item.id, draft)}
                                onCancel={() => {
                                  setEditingItemId(null);
                                  setEditingDraft(null);
                                }}
                              />
                            ) : (
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                  <p className="text-sm uppercase tracking-wide text-gray-400">{item.category}</p>
                                  <h4 className="text-xl font-semibold text-gray-900">{item.name}</h4>
                                  <p className="text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                  <div className="flex items-center gap-3 mt-3 text-sm">
                                    <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        item.is_available
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-gray-200 text-gray-600'
                                      }`}
                                    >
                                      {item.is_available ? 'Available' : 'Hidden'}
                                    </span>
                                    {item.is_vegetarian && (
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        Vegetarian
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setEditingDraft({
                                        name: item.name,
                                        description: item.description,
                                        price: item.price.toString(),
                                        category: item.category,
                                        image_url: item.image_url || '',
                                        is_available: item.is_available,
                                        is_vegetarian: item.is_vegetarian,
                                      });
                                    }}
                                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => removeMenuItem(selectedRestaurantId, item.id)}
                                    className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50"
                                  >
                                    Remove
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateMenuItem(selectedRestaurantId, item.id, {
                                        name: item.name,
                                        description: item.description,
                                        price: item.price.toString(),
                                        category: item.category,
                                        image_url: item.image_url || '',
                                        is_available: !item.is_available,
                                        is_vegetarian: item.is_vegetarian,
                                      })
                                    }
                                    disabled={menuSaving}
                                    className="px-4 py-2 rounded-lg border border-emerald-200 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                                  >
                                    {item.is_available ? 'Mark as Sold Out' : 'Mark as Available'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center mb-4">
                    <ClipboardList className="mr-3 text-emerald-500" size={24} /> Fulfillment Queue
                  </h2>
                  <p className="text-gray-600">
                    Track every order from confirmation to delivery. Update statuses in real time so the customer side
                    stays in sync.
                  </p>
                </div>
                <OrderManagement isEmbedded />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MenuComposerProps {
  draft: MenuDraft;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit: (draft: MenuDraft) => void;
  onCancel?: () => void;
}

const MenuComposer = ({ draft, disabled, submitLabel = 'Add dish', onSubmit, onCancel }: MenuComposerProps) => {
  const [localDraft, setLocalDraft] = useState<MenuDraft>(draft);

  useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  const updateDraft = (key: keyof MenuDraft, value: string | boolean) => {
    setLocalDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!localDraft.name || !localDraft.description || !localDraft.price || !localDraft.category) {
      alert('Please complete the name, description, price, and category fields.');
      return;
    }
    onSubmit(localDraft);
    if (!onCancel) {
      setLocalDraft(emptyMenuDraft);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dish name</label>
          <input
            type="text"
            value={localDraft.name}
            onChange={(event) => updateDraft('name', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Paneer Tikka Wrap"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <input
            type="text"
            value={localDraft.category}
            onChange={(event) => updateDraft('category', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Wraps, Bowls, Beverages"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={localDraft.price}
            onChange={(event) => updateDraft('price', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="9.99"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <input
            type="url"
            value={localDraft.image_url}
            onChange={(event) => updateDraft('image_url', event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="https://images.cloudkitchen/menu/paneer-wrap.jpg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={localDraft.description}
          onChange={(event) => updateDraft('description', event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="Smoky paneer tikka wrapped with mint chutney and pickled onions."
          rows={3}
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-emerald-600"
            checked={localDraft.is_available}
            onChange={(event) => updateDraft('is_available', event.target.checked)}
          />
          <span className="ml-2">Show on storefront</span>
        </label>
        <label className="inline-flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-emerald-600"
            checked={localDraft.is_vegetarian}
            onChange={(event) => updateDraft('is_vegetarian', event.target.checked)}
          />
          <span className="ml-2">Vegetarian</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="bg-emerald-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <Plus size={18} className="mr-2" /> {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
