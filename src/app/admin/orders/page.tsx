// app/admin/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "orders"));
        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds));
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status
      });
      setOrders(orders.map(order => 
        order.id === orderId ? {...order, status} : order
      ));
    } catch (err) {
      console.error("Error updating order:", err);
      setError("Failed to update order");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      {loading && <p className="text-gray-500">Loading orders...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="text-gray-500">No orders found</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-b py-3 px-4 text-left">Order ID</th>
                  <th className="border-b py-3 px-4 text-left">Customer</th>
                  <th className="border-b py-3 px-4 text-left">Total</th>
                  <th className="border-b py-3 px-4 text-left">Status</th>
                  <th className="border-b py-3 px-4 text-left">Date</th>
                  <th className="border-b py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="border-b py-3 px-4">{order.orderNumber}</td>
                    <td className="border-b py-3 px-4">{order.shipping?.name}</td>
                    <td className="border-b py-3 px-4">₹{order.total.toFixed(2)}</td>
                    <td className="border-b py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded text-sm ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="border-b py-3 px-4">
                      {order.timestamp?.seconds ? 
                        new Date(order.timestamp.seconds * 1000).toLocaleDateString() : 
                        'N/A'}
                    </td>
                    <td className="border-b py-3 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h2>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-6 grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Order Items</h3>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between border-b pb-2">
                            <div>
                              <p>{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                        <div className="pt-2 font-bold">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>₹{selectedOrder.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Shipping Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedOrder.shipping?.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.shipping?.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedOrder.shipping?.phone || 'N/A'}</p>
                        <p>
                          <span className="font-medium">Address:</span> {selectedOrder.shipping?.address}, {selectedOrder.shipping?.city}, {selectedOrder.shipping?.zip}
                        </p>
                      </div>

                      <h3 className="font-semibold mt-4 mb-2">Order Status</h3>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          updateOrderStatus(selectedOrder.id, e.target.value);
                          setSelectedOrder({...selectedOrder, status: e.target.value});
                        }}
                        className="w-full p-2 border rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}