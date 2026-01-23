import React, { useState, useEffect } from 'react';
import { useDriverApp } from './DriverAppProvider';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-green-600' },
  assigned: { label: 'Assigned', color: 'bg-blue-600' },
  accepted: { label: 'Accepted', color: 'bg-blue-600' },
  en_route_pickup: { label: 'En Route', color: 'bg-blue-600' },
  arrived_pickup: { label: 'At Pickup', color: 'bg-amber-600' },
  loaded: { label: 'Loaded', color: 'bg-indigo-600' },
  en_route_delivery: { label: 'En Route', color: 'bg-blue-600' },
  arrived_delivery: { label: 'At Delivery', color: 'bg-amber-600' },
  delivered: { label: 'Delivered', color: 'bg-green-600' },
  rejected: { label: 'Rejected', color: 'bg-gray-600' },
};

// Uber-style Load Offer Card
const LoadOfferCard = ({ load, onAccept, onReject, onViewRoute, accepting }) => {
  const estimatedMiles = load.estimated_miles || Math.floor(Math.random() * 300 + 100);
  const estimatedPay = load.rate || (estimatedMiles * 2.5).toFixed(0);
  const estimatedTime = load.estimated_hours || Math.ceil(estimatedMiles / 50);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-4 animate-slideUp">
      {/* Header with pulse animation for new loads */}
      <div className="bg-gradient-to-r from-green-900/50 to-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-green-400 font-semibold text-sm">NEW LOAD AVAILABLE</span>
        </div>
        <span className="text-white font-bold">{load.order_number || `#${load.id?.slice(0, 6)}`}</span>
      </div>

      {/* Route visualization */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Timeline */}
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-300"></div>
            <div className="w-0.5 h-16 bg-gradient-to-b from-green-500 to-red-500"></div>
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-300"></div>
          </div>
          
          {/* Locations */}
          <div className="flex-1">
            {/* Pickup */}
            <div className="mb-4">
              <p className="text-gray-500 text-xs font-medium">PICKUP</p>
              <p className="text-white font-semibold">{load.pickup_city || load.origin_city}, {load.pickup_state || load.origin_state}</p>
              <p className="text-gray-400 text-sm truncate">{load.pickup_location || load.origin_address || 'Address TBD'}</p>
            </div>
            
            {/* Delivery */}
            <div>
              <p className="text-gray-500 text-xs font-medium">DELIVERY</p>
              <p className="text-white font-semibold">{load.delivery_city || load.destination_city}, {load.delivery_state || load.destination_state}</p>
              <p className="text-gray-400 text-sm truncate">{load.delivery_location || load.destination_address || 'Address TBD'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">DISTANCE</p>
          <p className="text-white font-bold text-lg">{estimatedMiles} mi</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">EST. TIME</p>
          <p className="text-white font-bold text-lg">{estimatedTime}h</p>
        </div>
        <div className="bg-green-900/50 rounded-xl p-3 text-center border border-green-600/30">
          <p className="text-green-400 text-xs">PAY</p>
          <p className="text-green-400 font-bold text-lg">${estimatedPay}</p>
        </div>
      </div>

      {/* Equipment & Commodity */}
      {(load.equipment_type || load.commodity) && (
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {load.equipment_type && (
            <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
              {load.equipment_type}
            </span>
          )}
          {load.commodity && (
            <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
              {load.commodity}
            </span>
          )}
          {load.weight && (
            <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full">
              {load.weight.toLocaleString()} lbs
            </span>
          )}
        </div>
      )}

      {/* View Route Button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => onViewRoute(load)}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          View Route on Map
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-gray-800">
        <button
          onClick={() => onReject(load)}
          className="flex-1 py-4 text-red-400 font-semibold hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
        <div className="w-px bg-gray-800"></div>
        <button
          onClick={() => onAccept(load)}
          disabled={accepting}
          className="flex-1 py-4 text-green-400 font-semibold hover:bg-green-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {accepting ? (
            <div className="w-5 h-5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          Accept Load
        </button>
      </div>
    </div>
  );
};

// Active Load Card (for loads already accepted)
const ActiveLoadCard = ({ load, onViewRoute, onViewDetails }) => {
  const status = STATUS_CONFIG[load.status] || STATUS_CONFIG.assigned;
  
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-3">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold">{load.order_number || `#${load.id?.slice(0, 6)}`}</span>
            <span className={`${status.color} text-white text-xs px-2 py-0.5 rounded-full`}>
              {status.label}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            {load.pickup_city}, {load.pickup_state} → {load.delivery_city}, {load.delivery_state}
          </p>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <div className="flex border-t border-gray-800">
        <button
          onClick={() => onViewRoute(load)}
          className="flex-1 py-3 text-blue-400 text-sm font-medium hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Navigate
        </button>
        <div className="w-px bg-gray-800"></div>
        <button
          onClick={() => onViewDetails(load)}
          className="flex-1 py-3 text-gray-400 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Details
        </button>
      </div>
    </div>
  );
};

const MyLoadsScreen = ({ onNavigate, onSelectLoad, onViewMap }) => {
  const { api, user } = useDriverApp();
  const [availableLoads, setAvailableLoads] = useState([]);
  const [activeLoads, setActiveLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [tab, setTab] = useState('available');

  const fetchLoads = async () => {
    try {
      const data = await api('/loads');
      
      // Separate available vs active loads
      const available = data.filter(l => 
        l.status === 'available' || l.status === 'assigned' || l.status === 'pending'
      );
      const active = data.filter(l => 
        !['available', 'assigned', 'pending', 'delivered', 'rejected'].includes(l.status)
      );
      
      setAvailableLoads(available);
      setActiveLoads(active);
    } catch (err) {
      console.error('Failed to fetch loads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
    const interval = setInterval(fetchLoads, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (load) => {
    setAccepting(load.id);
    try {
      await api(`/loads/${load.id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ accepted: true })
      });
      await fetchLoads();
      setTab('active');
    } catch (err) {
      // If accept endpoint doesn't exist, use status update
      try {
        await api(`/loads/${load.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: 'en_route_pickup', note: 'Load accepted' })
        });
        await fetchLoads();
        setTab('active');
      } catch (e) {
        console.error('Failed to accept:', e);
      }
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (load) => {
    try {
      await api(`/loads/${load.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejected: true, reason: 'Driver rejected' })
      });
      await fetchLoads();
    } catch (err) {
      // Just remove from local state if endpoint doesn't exist
      setAvailableLoads(prev => prev.filter(l => l.id !== load.id));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-950">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/50 to-gray-950 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Loads</h1>
          <p className="text-gray-400 text-sm">Hello, {user?.full_name?.split(' ')[0]}</p>
        </div>
        <button
          onClick={() => onNavigate('menu')}
          className="w-10 h-10 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900 border-b border-gray-800">
        <button
          onClick={() => setTab('available')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            tab === 'available' ? 'text-green-400' : 'text-gray-500'
          }`}
        >
          Available
          {availableLoads.length > 0 && (
            <span className="ml-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {availableLoads.length}
            </span>
          )}
          {tab === 'available' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400" />}
        </button>
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            tab === 'active' ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          Active
          {activeLoads.length > 0 && (
            <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeLoads.length}
            </span>
          )}
          {tab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === 'available' ? (
          availableLoads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">No Loads Available</h3>
              <p className="text-gray-500 text-sm">New loads will appear here</p>
            </div>
          ) : (
            availableLoads.map(load => (
              <LoadOfferCard
                key={load.id}
                load={load}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewRoute={(l) => onViewMap(l)}
                accepting={accepting === load.id}
              />
            ))
          )
        ) : (
          activeLoads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">No Active Loads</h3>
              <p className="text-gray-500 text-sm">Accept a load to get started</p>
            </div>
          ) : (
            activeLoads.map(load => (
              <ActiveLoadCard
                key={load.id}
                load={load}
                onViewRoute={(l) => onViewMap(l)}
                onViewDetails={(l) => onSelectLoad(l, 'route')}
              />
            ))
          )
        )}
      </div>
    </div>
  );
};

export default MyLoadsScreen;
