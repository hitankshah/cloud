import { useState } from 'react';
import { ArrowLeft, MapPin, Phone, FileText } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  supabase,
  supabaseConfigurationError,
  SUPABASE_CONFIG_ERROR
} from '../lib/supabase';

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const Checkout = ({ onBack, onSuccess }: CheckoutProps) => {
  const { cart, getTotalAmount, clearCart } = useCart();
  const { user, userProfile, isGuest, guestInfo } = useAuth();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState(guestInfo?.phone || '');
  const [customerName, setCustomerName] = useState(guestInfo?.fullName || '');
  const [customerEmail, setCustomerEmail] = useState(guestInfo?.email || '');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const subtotal = getTotalAmount();
  const deliveryFee = 2.99;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields for both authenticated and guest users
    if (isGuest && (!customerName || !customerEmail || !phone)) {
      addNotification('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }

    if (!isGuest && (!user || !userProfile)) {
      addNotification('Please sign in to place an order', 'error');
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error(supabaseConfigurationError || SUPABASE_CONFIG_ERROR);
      }
      const orderData = {
        customer_id: isGuest ? null : user!.id,
        customer_name: isGuest ? customerName : userProfile!.full_name,
        customer_email: isGuest ? customerEmail : userProfile!.email,
        customer_phone: phone,
        status: 'pending' as const,
        total_amount: total,
        delivery_address: deliveryAddress,
        special_instructions: specialInstructions,
        is_read: false,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        item_name: item.name,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      addNotification('Order placed successfully!', 'success');
      clearCart();
      onSuccess();
    } catch (err: any) {
      console.error('Error placing order:', err);
      addNotification(err.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Cart
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="mt-2 text-emerald-50">
              {isGuest ? 'Complete your order details as a guest' : 'Complete your order details'}
            </p>
            {isGuest && (
              <div className="mt-4 bg-emerald-500 bg-opacity-50 rounded-lg px-4 py-2">
                <p className="text-sm text-emerald-50">
                  🎯 You're ordering as a guest. Sign up to track your orders and save your preferences!
                </p>
              </div>
            )}
          </div>

          <div className="p-8">
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {isGuest && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={18} className="mr-2" />
                  Delivery Address
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your complete delivery address"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Phone size={18} className="mr-2" />
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Phone number with country code (e.g., +1 555-123-4567)"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FileText size={18} className="mr-2" />
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Any special requests for your order?"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-gray-600">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-600 pt-3 border-t">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
