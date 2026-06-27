import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  QrCode, 
  CreditCard, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  LogOut, 
  LogIn, 
  UserPlus, 
  LayoutDashboard, 
  Ticket, 
  ChevronRight, 
  Filter, 
  Download, 
  RefreshCw, 
  FileText, 
  ArrowLeft,
  X,
  CreditCard as CardIcon
} from 'lucide-react';

import { BarChart, LineChart, PieChart } from './components/CustomCharts';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ToastContainer, ToastMessage } from './components/Toast';
import { User, Event, Booking, Payment, SystemStats } from './types';

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<
    'home' | 'login' | 'register' | 'event_detail' | 'booking' | 'payment' | 'confirmation' | 'bookings' | 'admin_dashboard' | 'admin_events' | 'admin_checkin'
  >('home');
  
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('event_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  
  // Events & Data State
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Booking Selection State
  const [selectedSeatsCount, setSelectedSeatsCount] = useState<number>(1);
  const [selectedSeatsMap, setSelectedSeatsMap] = useState<number[]>([]); // indexes of chosen seats
  
  // Payment Form State
  const [paymentCardNumber, setPaymentCardNumber] = useState('');
  const [paymentExpiry, setPaymentExpiry] = useState('');
  const [paymentCvv, setPaymentCvv] = useState('');
  const [paymentCardName, setPaymentCardName] = useState('');
  
  // Booking result/confirmation page state
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [confirmedPayment, setConfirmedPayment] = useState<Payment | null>(null);
  
  // User Personal Dashboard State
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  
  // Admin Analytics & Controls State
  const [adminStats, setAdminStats] = useState<SystemStats>({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalAttendeesCheckedIn: 0
  });
  const [adminCharts, setAdminCharts] = useState<{
    ticketsSoldPerEvent: { name: string; tickets: number }[];
    eventsByCategory: { category: string; count: number }[];
    bookingsOverTime: { date: string; bookings: number }[];
    recentBookings: Booking[];
  }>({
    ticketsSoldPerEvent: [],
    eventsByCategory: [],
    bookingsOverTime: [],
    recentBookings: []
  });
  
  // Event Creation & Modification Form State
  const [isEditingEvent, setIsEditingEvent] = useState<boolean>(false);
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormDesc, setEventFormDesc] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormTime, setEventFormTime] = useState('');
  const [eventFormVenue, setEventFormVenue] = useState('');
  const [eventFormCategory, setEventFormCategory] = useState<'Music' | 'Tech' | 'Sports' | 'Business' | 'Education'>('Tech');
  const [eventFormSeats, setEventFormSeats] = useState<number>(100);
  const [eventFormPrice, setEventFormPrice] = useState<number>(0);

  // Admin Check-in / Verification State
  const [checkinId, setCheckinId] = useState('');
  const [checkinResult, setCheckinResult] = useState<{
    status: 'success' | 'checked_in' | 'error';
    message: string;
    booking?: Booking;
  } | null>(null);
  
  // Loading & Toast Notification States
  const [globalLoading, setGlobalLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper to add a Toast
  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check Token Authentication and load initial events on mount
  useEffect(() => {
    fetchEvents();
    if (token) {
      validateToken(token);
    }
  }, [token]);

  // Handle live search & categories filtering
  useEffect(() => {
    let result = events;
    if (selectedCategory !== 'All') {
      result = result.filter(e => e.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.venue.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    setFilteredEvents(result);
  }, [events, searchQuery, selectedCategory]);

  const validateToken = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        addToast(`Welcome back, ${data.user.name}! 👋`, 'success');
      } else {
        // Token is invalid/expired
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const fetchEvents = async () => {
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        addToast('Failed to fetch events from database', 'error');
      }
    } catch (err) {
      addToast('Backend server connection error', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!token) return;
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/bookings/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyBookings(data);
      } else {
        addToast('Failed to load your booking history', 'error');
      }
    } catch (err) {
      addToast('Error contacting server', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    if (!token || currentUser?.role !== 'admin') return;
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminStats(data.stats);
        setAdminCharts(data.charts);
      } else {
        addToast('Failed to load admin analytics statistics', 'error');
      }
    } catch (err) {
      addToast('Error reaching admin server portal', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      addToast('Please complete all form fields', 'error');
      return;
    }
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('event_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        addToast(`Successfully authenticated as ${data.user.name} 🎉`, 'success');
        
        // Reset inputs
        setAuthEmail('');
        setAuthPassword('');
        
        // Redirect
        if (data.user.role === 'admin') {
          setCurrentView('admin_dashboard');
          fetchAdminStats();
        } else {
          setCurrentView('home');
        }
      } else {
        addToast(data.message || 'Invalid email or password', 'error');
      }
    } catch (err) {
      addToast('Authentication server offline', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword) {
      addToast('Please enter all required information', 'error');
      return;
    }
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('event_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        addToast('Account created successfully! Welcome to EventHub 🎆', 'success');
        
        // Reset
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        
        setCurrentView('home');
      } else {
        addToast(data.message || 'Registration failed', 'error');
      }
    } catch (err) {
      addToast('Server connection failed', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('event_token');
    setToken(null);
    setCurrentUser(null);
    setMyBookings([]);
    addToast('Logged out of session', 'info');
    setCurrentView('home');
  };

  // Event CRUD Operations
  const handleCreateOrEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormTitle || !eventFormDesc || !eventFormDate || !eventFormTime || !eventFormVenue || !eventFormSeats) {
      addToast('Please fill in all event details', 'error');
      return;
    }

    setGlobalLoading(true);
    const bodyData = {
      title: eventFormTitle,
      description: eventFormDesc,
      date: eventFormDate,
      time: eventFormTime,
      venue: eventFormVenue,
      category: eventFormCategory,
      totalSeats: Number(eventFormSeats),
      ticketPrice: Number(eventFormPrice)
    };

    try {
      let response;
      if (isEditingEvent && editEventId) {
        response = await fetch(`/api/events/${editEventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });
      } else {
        response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });
      }

      if (response.ok) {
        addToast(
          isEditingEvent ? 'Event updated successfully' : 'New event created successfully 🚀', 
          'success'
        );
        resetEventForm();
        fetchEvents();
        setCurrentView('admin_events');
      } else {
        const errorData = await response.json();
        addToast(errorData.message || 'Failed to save event information', 'error');
      }
    } catch (err) {
      addToast('Connection error during save operation', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const startEditEvent = (evt: Event) => {
    setIsEditingEvent(true);
    setEditEventId(evt.id);
    setEventFormTitle(evt.title);
    setEventFormDesc(evt.description);
    setEventFormDate(evt.date);
    setEventFormTime(evt.time);
    setEventFormVenue(evt.venue);
    setEventFormCategory(evt.category);
    setEventFormSeats(evt.totalSeats);
    setEventFormPrice(evt.ticketPrice);
    setCurrentView('admin_events');
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    setGlobalLoading(true);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        addToast('Event deleted successfully', 'success');
        fetchEvents();
      } else {
        addToast('Failed to delete this event', 'error');
      }
    } catch (err) {
      addToast('Connection error', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const resetEventForm = () => {
    setIsEditingEvent(false);
    setEditEventId(null);
    setEventFormTitle('');
    setEventFormDesc('');
    setEventFormDate('');
    setEventFormTime('');
    setEventFormVenue('');
    setEventFormCategory('Tech');
    setEventFormSeats(100);
    setEventFormPrice(0);
  };

  // Booking and Seats Handlers
  const handleSelectEventForBooking = (evt: Event) => {
    setSelectedEvent(evt);
    setSelectedSeatsCount(1);
    setSelectedSeatsMap([0]); // first seat selected by default
    setCurrentView('event_detail');
  };

  const handleSeatGridToggle = (seatIndex: number) => {
    if (selectedSeatsMap.includes(seatIndex)) {
      // Remove unless it's the last one
      if (selectedSeatsMap.length > 1) {
        setSelectedSeatsMap(prev => prev.filter(i => i !== seatIndex));
        setSelectedSeatsCount(prev => prev - 1);
      }
    } else {
      // Add and increment
      setSelectedSeatsMap(prev => [...prev, seatIndex]);
      setSelectedSeatsCount(prev => prev + 1);
    }
  };

  const initiateBookingCheckout = () => {
    if (!token) {
      addToast('Please login or register to book event tickets', 'info');
      setCurrentView('login');
      return;
    }
    if (!selectedEvent) return;
    
    if (selectedEvent.availableSeats < selectedSeatsCount) {
      addToast('Sorry, there are not enough remaining seats available', 'error');
      return;
    }

    if (selectedEvent.ticketPrice === 0) {
      // Free ticket, bypass card entry directly to ticket validation on confirmation screen
      processBooking(null);
    } else {
      // Paid, move to simulated payment page
      setCurrentView('payment');
    }
  };

  const processBooking = async (paymentDetails: any | null) => {
    if (!selectedEvent) return;
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          seatsCount: selectedSeatsCount,
          paymentDetails: paymentDetails
        })
      });

      const data = await response.json();
      if (response.ok) {
        setConfirmedBooking(data.booking);
        setConfirmedPayment(data.payment);
        addToast('Ticket booking confirmed successfully! 🎉', 'success');
        
        // Reset card details
        setPaymentCardNumber('');
        setPaymentExpiry('');
        setPaymentCvv('');
        setPaymentCardName('');
        
        // Redirect to QR Ticket
        setCurrentView('confirmation');
        fetchEvents(); // update counts
      } else {
        addToast(data.message || 'Failed to complete booking process', 'error');
      }
    } catch (err) {
      addToast('Network error during checkout validation', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSimulatedCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCardNumber || !paymentExpiry || !paymentCvv || !paymentCardName) {
      addToast('Please input all security card information details', 'error');
      return;
    }

    if (paymentCardNumber.replace(/\s/g, '').length < 16) {
      addToast('Please enter a valid 16-digit card number', 'error');
      return;
    }

    // Pass simulated parameters
    processBooking({
      cardNumber: paymentCardNumber,
      expiry: paymentExpiry,
      cvv: paymentCvv,
      cardHolderName: paymentCardName
    });
  };

  // Ticket QR Checkin Gate Handler
  const handleCheckinVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinId.trim()) {
      addToast('Please type a Booking ID', 'error');
      return;
    }
    setGlobalLoading(true);
    try {
      const response = await fetch('/api/bookings/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: checkinId })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.status === 'success') {
          setCheckinResult({
            status: 'success',
            message: data.message,
            booking: data.booking
          });
          addToast('Verified: Valid Ticket checked in successfully!', 'success');
        } else {
          setCheckinResult({
            status: 'checked_in',
            message: data.message,
            booking: data.booking
          });
          addToast('Notice: Ticket was already checked in previously', 'info');
        }
      } else {
        setCheckinResult({
          status: 'error',
          message: data.message || 'Invalid Ticket ID ❌'
        });
        addToast('Validation Error: Ticket could not be verified', 'error');
      }
    } catch (err) {
      addToast('Gate verify server offline', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // Helper for Category Styling badge
  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Music': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Tech': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Sports': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Business': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Education': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryGradient = (cat: string) => {
    switch (cat) {
      case 'Music': return 'from-pink-500 to-rose-700';
      case 'Tech': return 'from-blue-600 to-indigo-800';
      case 'Sports': return 'from-rose-500 to-red-700';
      case 'Business': return 'from-emerald-500 to-teal-800';
      case 'Education': return 'from-amber-500 to-orange-700';
      default: return 'from-purple-600 to-indigo-800';
    }
  };

  // Printable Download handler
  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-800" id="main-root-container">
      
      {/* GLOBAL TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* TOP DECORATIVE STATUS BAR */}
      <div className="bg-[#6C3EB8] text-white text-xs py-1 px-4 text-center font-medium tracking-wide border-b border-purple-800 flex justify-between items-center sm:px-8" id="decorative-top-bar">
        <span>🎓 Academic Final Project Portal: Evently EMS PRO</span>
        <span className="hidden sm:inline">Server Node Live: 127.0.0.1:3000 • Verified Secure SSL 🔒</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative" id="layout-wrapper">
        
        {/* SIDEBAR NAVIGATION - "High Density" Theme Design */}
        <aside className="w-full md:w-64 bg-[#6C3EB8] text-white flex flex-col shrink-0 border-r border-purple-900 shadow-2xl" id="sidebar-panel">
          
          {/* Logo Brand Header */}
          <div className="p-6 flex items-center gap-3 border-b border-purple-800 cursor-pointer" onClick={() => setCurrentView('home')} id="sidebar-logo-header">
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center text-slate-900 font-extrabold text-xl shadow-lg border border-yellow-300">
              E
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight leading-none">EventHub</span>
              <span className="text-[10px] text-[#FFD700] font-extrabold tracking-widest mt-1">ACADEMIC PRO</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" id="sidebar-navigation">
            
            <div className="text-[10px] uppercase text-purple-300 opacity-60 font-extrabold tracking-widest px-3 py-1">
              General Area
            </div>
            
            <button 
              onClick={() => setCurrentView('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                currentView === 'home' || currentView === 'event_detail'
                  ? 'bg-white/10 text-[#FFD700] border-l-4 border-[#FFD700]'
                  : 'hover:bg-white/5 text-white/85'
              }`}
              id="nav-home-btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Explore Events</span>
            </button>

            {currentUser && (
              <button 
                onClick={() => {
                  fetchMyBookings();
                  setCurrentView('bookings');
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  currentView === 'bookings'
                    ? 'bg-white/10 text-[#FFD700] border-l-4 border-[#FFD700]'
                    : 'hover:bg-white/5 text-white/85'
                }`}
                id="nav-mybookings-btn"
              >
                <Ticket className="w-4 h-4" />
                <span>My Bookings</span>
                {myBookings.length > 0 && (
                  <span className="ml-auto bg-yellow-400 text-purple-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {myBookings.length}
                  </span>
                )}
              </button>
            )}

            {/* ADMIN CONSOLE HEADER */}
            <div className="pt-6">
              <div className="text-[10px] uppercase text-purple-300 opacity-60 font-extrabold tracking-widest px-3 py-1">
                Admin Portal
              </div>
              
              {currentUser?.role === 'admin' ? (
                <div className="space-y-1.5 mt-1.5" id="admin-routes-block">
                  <button 
                    onClick={() => {
                      fetchAdminStats();
                      setCurrentView('admin_dashboard');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      currentView === 'admin_dashboard'
                        ? 'bg-white/10 text-[#FFD700] border-l-4 border-[#FFD700]'
                        : 'hover:bg-white/5 text-white/85'
                    }`}
                    id="nav-admin-dash"
                  >
                    <LayoutDashboard className="w-4 h-4 text-yellow-400" />
                    <span>Analytics Dashboard</span>
                  </button>

                  <button 
                    onClick={() => {
                      resetEventForm();
                      setCurrentView('admin_events');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      currentView === 'admin_events'
                        ? 'bg-white/10 text-[#FFD700] border-l-4 border-[#FFD700]'
                        : 'hover:bg-white/5 text-white/85'
                    }`}
                    id="nav-admin-events"
                  >
                    <Plus className="w-4 h-4 text-yellow-400" />
                    <span>Manage Events</span>
                  </button>

                  <button 
                    onClick={() => {
                      setCheckinId('');
                      setCheckinResult(null);
                      setCurrentView('admin_checkin');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      currentView === 'admin_checkin'
                        ? 'bg-white/10 text-[#FFD700] border-l-4 border-[#FFD700]'
                        : 'hover:bg-white/5 text-white/85'
                    }`}
                    id="nav-admin-checkin"
                  >
                    <QrCode className="w-4 h-4 text-yellow-400" />
                    <span>Gate Check-In System</span>
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2.5 mt-1.5 bg-black/15 rounded-xl border border-white/5" id="admin-locked-notice">
                  <p className="text-[10px] text-purple-200 leading-relaxed font-medium">
                    🔐 Access Restricted. Login as Admin (<b className="text-yellow-300 select-all">admin@evently.com</b> / <b className="text-yellow-300">password</b>) to unlock.
                  </p>
                </div>
              )}
            </div>

          </nav>

          {/* User Section Footer */}
          <div className="p-4 border-t border-purple-800 bg-purple-950/40" id="sidebar-footer">
            {currentUser ? (
              <div className="space-y-3" id="logged-in-panel">
                <div className="flex items-center gap-3" id="user-info-row">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400 text-purple-900 font-bold flex items-center justify-center text-sm border border-yellow-300 shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate text-white">{currentUser.name}</div>
                    <div className="text-[10px] text-purple-300 truncate font-mono">{currentUser.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-2" id="user-badges-logout">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${
                    currentUser.role === 'admin' 
                      ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {currentUser.role}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] text-purple-200 hover:text-white flex items-center gap-1 font-bold transition-all hover:translate-x-1"
                    id="logout-action-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2" id="logged-out-panel">
                <button 
                  onClick={() => setCurrentView('login')}
                  className="w-full py-2 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  id="action-login-gate"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button 
                  onClick={() => setCurrentView('register')}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2"
                  id="action-register-gate"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN BODY PLATFORM CONTENT */}
        <main className="flex-1 flex flex-col min-w-0" id="main-frame-panel">
          
          {/* MAIN PLATFORM HEADER */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm" id="main-header">
            
            {/* Search Input Filter Panel */}
            <div className="flex-1 max-w-md" id="header-search-block">
              {currentView === 'home' ? (
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search events by title, venue, category, or descriptions..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs border border-transparent focus:bg-white focus:border-purple-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                    id="global-search-input"
                  />
                  <div className="absolute left-3.5 top-2.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500" id="header-nav-indicator">
                  <span className="capitalize">{currentView.replace('_', ' ')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-purple-700">Live Workspace Portal</span>
                </div>
              )}
            </div>

            {/* Quick Actions / Date Information */}
            <div className="flex items-center gap-4 ml-4" id="header-profile-block">
              <span className="hidden lg:inline text-xs text-slate-500 font-semibold" id="current-calendar-date">
                📅 Date: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              
              {currentUser?.role === 'admin' && (
                <button 
                  onClick={() => {
                    resetEventForm();
                    setCurrentView('admin_events');
                    addToast('Event form initialized', 'info');
                  }}
                  className="px-4 py-2 bg-[#6C3EB8] hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/15 active:scale-95 transition-all flex items-center gap-1.5"
                  id="admin-create-event-header-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Event</span>
                </button>
              )}
            </div>

          </header>

          {/* WORKSPACE MAIN INTERACTION ZONE */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8" id="primary-view-container">
            
            {globalLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-40 transition-all" id="global-spinner-overlay">
                <div className="bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 flex flex-col items-center gap-3">
                  <LoadingSpinner size="lg" />
                  <span className="text-xs text-slate-500 font-semibold animate-pulse">Communicating with event database...</span>
                </div>
              </div>
            )}

            {/* 1. HOME VIEW (EVENT CARDS LISTING) */}
            {currentView === 'home' && (
              <div className="space-y-6" id="home-view-stage">
                
                {/* Hero Promotion Showcase */}
                <div className="relative bg-gradient-to-r from-purple-900 via-[#6C3EB8] to-purple-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden" id="hero-showcase">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-8 translate-x-8">
                    <Calendar className="w-96 h-96" />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="px-2.5 py-1 bg-yellow-400 text-slate-900 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-sm">
                      🌟 Premium academic exhibition
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      Experience Grand Campus Events with Real-Time QR Check-Ins
                    </h1>
                    <p className="text-xs sm:text-sm text-purple-150 font-normal leading-relaxed max-w-xl">
                      Book seats instantly, receive your secure QR ticket code, simulate frictionless checkout card pay, and verify admissions under unified admin controllers.
                    </p>
                  </div>
                </div>

                {/* Filters & Grid header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-b border-slate-100 pb-4" id="home-filter-row">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Available Campus Events</h2>
                    <p className="text-xs text-slate-500">Discover and book tech summits, music galas, bootcamps and athletic competitions.</p>
                  </div>

                  {/* Category Pills Filters */}
                  <div className="flex flex-wrap gap-2" id="category-filter-pills">
                    {['All', 'Music', 'Tech', 'Sports', 'Business', 'Education'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedCategory === cat 
                            ? 'bg-[#6C3EB8] text-white border-[#6C3EB8] shadow-md shadow-purple-600/10' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                        }`}
                        id={`filter-pill-${cat}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EVENTS BENTO GRID */}
                {filteredEvents.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center" id="empty-state-card">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">No events matched your parameters</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try typing another query or select a different category pill above.</p>
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                      className="mt-4 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100 hover:bg-purple-100 transition-all"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="events-grid">
                    {filteredEvents.map((evt) => (
                      <div 
                        key={evt.id} 
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                        id={`event-card-${evt.id}`}
                      >
                        {/* Event Category Header Banner */}
                        <div className={`h-28 bg-gradient-to-br ${getCategoryGradient(evt.category)} p-5 relative shrink-0`} id={`card-banner-${evt.id}`}>
                          <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-lg text-[9px] text-white font-extrabold uppercase tracking-wider">
                            {evt.category}
                          </span>
                          
                          <div className="absolute bottom-3 left-5 right-5 text-white">
                            <h3 className="font-extrabold text-sm tracking-tight truncate leading-none group-hover:text-[#FFD700] transition-colors">
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between" id={`card-details-${evt.id}`}>
                          <div className="space-y-3">
                            {/* Short Description */}
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                              {evt.description}
                            </p>

                            {/* Event Metadata Icons */}
                            <div className="space-y-1.5 text-slate-600 pt-1" id={`card-meta-${evt.id}`}>
                              <div className="flex items-center gap-2 text-[11px] font-medium">
                                <Calendar className="w-3.5 h-3.5 text-purple-500" />
                                <span>Date: {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-medium">
                                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                <span className="truncate">Venue: {evt.venue}</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Action Details */}
                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between" id={`card-footer-${evt.id}`}>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Price</div>
                              <div className="text-sm font-extrabold text-slate-800 mt-1">
                                {evt.ticketPrice === 0 ? (
                                  <span className="text-emerald-600 font-black">Free</span>
                                ) : (
                                  `₹${evt.ticketPrice}`
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              {evt.availableSeats === 0 ? (
                                <span className="inline-block px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-[10px] font-extrabold uppercase">
                                  Sold Out ❌
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleSelectEventForBooking(evt)}
                                  className="px-4 py-1.5 bg-[#6C3EB8] hover:bg-purple-700 text-[#FFD700] font-bold text-xs rounded-xl shadow-md shadow-purple-600/5 hover:shadow-lg transition-all active:scale-95"
                                  id={`book-btn-trigger-${evt.id}`}
                                >
                                  Book Tickets
                                </button>
                              )}
                              <div className="text-[10px] text-slate-400 font-medium mt-1">
                                {evt.availableSeats} / {evt.totalSeats} seats remaining
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. LOGIN PAGE */}
            {currentView === 'login' && (
              <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden" id="login-view-stage">
                <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-6 text-center relative">
                  <h2 className="text-xl font-bold">Secure Gate Identity Login</h2>
                  <p className="text-xs text-purple-200 mt-1">Access secure bookings and custom admin panels</p>
                </div>
                
                <form onSubmit={handleLogin} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. user@evently.com or admin@evently.com" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-purple-600 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
                    <input 
                      type="password" 
                      placeholder="e.g. password" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-purple-600 transition-all"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-[#6C3EB8] hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Authorize Session</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-500" id="login-accounts-disclosure">
                    <div className="p-3 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-left space-y-1">
                      <p className="font-bold">🔑 Simulated Test Accounts:</p>
                      <p><b>Admin Console</b>: admin@evently.com | password</p>
                      <p><b>Student User</b>: user@evently.com | password</p>
                    </div>
                    <p className="mt-4">
                      Don't have an account yet?{' '}
                      <button 
                        type="button" 
                        onClick={() => setCurrentView('register')}
                        className="text-purple-600 hover:underline font-bold"
                      >
                        Register Now
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* 3. REGISTER PAGE */}
            {currentView === 'register' && (
              <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden" id="register-view-stage">
                <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-6 text-center relative">
                  <h2 className="text-xl font-bold">Register Platform Identity</h2>
                  <p className="text-xs text-purple-200 mt-1">Create an account to book seats and keep booking histories</p>
                </div>
                
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-purple-600 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. john@example.com" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-purple-600 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter password minimum 6 chars" 
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-purple-600 transition-all"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-[#6C3EB8] hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Generate Identity Platform</span>
                  </button>

                  <div className="text-center text-xs text-slate-500 pt-2">
                    Already registered?{' '}
                    <button 
                      type="button" 
                      onClick={() => setCurrentView('login')}
                      className="text-purple-600 hover:underline font-bold"
                    >
                      Login Here
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 4. EVENT DETAIL PAGE */}
            {currentView === 'event_detail' && selectedEvent && (
              <div className="space-y-6" id="detail-view-stage">
                
                {/* Back button */}
                <button 
                  onClick={() => setCurrentView('home')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to All Events</span>
                </button>

                {/* Event details container layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="detail-bento-layout">
                  
                  {/* Left Column: Cover Banner and Information */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Stylized Category Header */}
                      <div className={`p-8 bg-gradient-to-br ${getCategoryGradient(selectedEvent.category)} text-white relative`}>
                        <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-lg text-[9px] text-white font-extrabold uppercase tracking-widest border border-white/20">
                          {selectedEvent.category} Category
                        </span>
                        
                        <h1 className="text-2xl sm:text-3xl font-extrabold mt-4 leading-tight">{selectedEvent.title}</h1>
                        
                        {/* Summary metadata tags */}
                        <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-purple-100" id="detail-metadata-badges">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 text-[#FFD700]" />
                            {new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-4 h-4 text-[#FFD700]" />
                            Time: {selectedEvent.time} hrs
                          </span>
                          <span className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-4 h-4 text-[#FFD700]" />
                            Venue: {selectedEvent.venue}
                          </span>
                        </div>
                      </div>

                      {/* Descriptive and narrative paragraphs */}
                      <div className="p-6 sm:p-8 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Event Overview</h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                          {selectedEvent.description}
                        </p>
                        <p className="text-xs text-slate-400 italic">
                          * Please note: Standard admissions require presenting the verified QR ticket ticket sent to your dashboard upon checking out. Food and materials are covered under paid seat entries.
                        </p>
                      </div>

                    </div>

                    {/* INTERACTIVE CAMPUS SEAT SELECTOR MAP */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6" id="seats-selector-widget">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span>Interactive Seat Allocator Grid</span>
                            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 uppercase">Interactive</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">Select multiple seats from the interactive map to reserve them.</p>
                        </div>

                        {/* Map indicators */}
                        <div className="flex gap-4 text-xs font-semibold" id="map-legend">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded" />
                            Available
                          </span>
                          <span className="flex items-center gap-1.5 text-purple-600">
                            <span className="w-3 h-3 bg-purple-600 rounded" />
                            Selected
                          </span>
                        </div>
                      </div>

                      {/* Visual representations of seats */}
                      <div className="space-y-4">
                        <div className="w-full text-center py-2 bg-slate-900 text-white rounded text-[10px] font-bold tracking-widest uppercase opacity-75 shadow-sm">
                          🎓 PRIMARY STAGE & PRESENTATION PLATFORM
                        </div>

                        {/* Grid of seats */}
                        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 max-w-lg mx-auto" id="visual-seat-grid">
                          {Array.from({ length: 40 }).map((_, idx) => {
                            const isChosen = selectedSeatsMap.includes(idx);
                            return (
                              <button
                                key={idx}
                                onClick={() => handleSeatGridToggle(idx)}
                                className={`h-8 rounded-lg text-[10px] font-bold flex items-center justify-center border transition-all active:scale-90 ${
                                  isChosen 
                                    ? 'bg-[#6C3EB8] text-white border-[#6C3EB8] shadow-lg shadow-purple-600/20' 
                                    : 'bg-slate-50 text-slate-600 hover:border-slate-350 hover:bg-slate-100'
                                }`}
                                id={`seat-unit-${idx}`}
                              >
                                {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="text-center text-xs text-slate-400 pt-2 font-medium">
                          You have selected <b className="text-purple-700">{selectedSeatsCount}</b> seat(s) on the platform maps.
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Checkout Summary Panel */}
                  <div className="lg:col-span-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-5 sticky top-6" id="booking-sidebar-invoice">
                      <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3">Booking Invoice Details</h3>

                      {/* Pricing list */}
                      <div className="space-y-3 text-xs" id="invoice-details-list">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Ticket Ticket Base Unit Price</span>
                          <span className="font-bold text-slate-800">
                            {selectedEvent.ticketPrice === 0 ? 'Free' : `₹${selectedEvent.ticketPrice}`}
                          </span>
                        </div>

                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Selected Seats Count</span>
                          <span className="font-bold text-slate-800">{selectedSeatsCount} tickets</span>
                        </div>

                        <div className="flex justify-between font-medium">
                          <span className="text-slate-500">Tax & Campus Surcharge</span>
                          <span className="font-bold text-emerald-600">₹0 (Academic Free Waiver)</span>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-end">
                          <span className="text-sm font-bold text-slate-700">Gross Total</span>
                          <span className="text-xl font-black text-purple-700">
                            ₹{selectedEvent.ticketPrice * selectedSeatsCount}
                          </span>
                        </div>
                      </div>

                      {/* Seats availability meter */}
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-xs space-y-1.5" id="seats-meter">
                        <div className="flex justify-between font-bold text-purple-800">
                          <span>Seat Availability Meter</span>
                          <span>{selectedEvent.availableSeats} Left</span>
                        </div>
                        
                        {/* Progress line */}
                        <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#6C3EB8] h-full transition-all duration-500" 
                            style={{ width: `${(selectedEvent.availableSeats / selectedEvent.totalSeats) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-purple-500 leading-normal">
                          Reserve soon. Seats are deducted live upon successful completion of payment verification.
                        </p>
                      </div>

                      {/* Action checkout buttons */}
                      <div className="pt-2">
                        <button
                          onClick={initiateBookingCheckout}
                          disabled={selectedEvent.availableSeats < selectedSeatsCount}
                          className="w-full py-2.5 bg-[#6C3EB8] hover:bg-purple-700 text-[#FFD700] disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Book Ticket Now</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 5. PAYMENT SIMULATED SCREEN */}
            {currentView === 'payment' && selectedEvent && (
              <div className="max-w-2xl mx-auto my-6 space-y-6" id="payment-view-stage">
                
                {/* Header Back details */}
                <button 
                  onClick={() => setCurrentView('event_detail')}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Ticket Seat Maps</span>
                </button>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-12" id="payment-invoice-grid">
                  
                  {/* Left panel: Total Bill summary */}
                  <div className="md:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between" id="payment-invoice-summary">
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase font-bold text-purple-300 tracking-widest">Order Invoice</span>
                      <h3 className="text-lg font-bold tracking-tight text-white leading-tight">{selectedEvent.title}</h3>
                      
                      <div className="space-y-2 text-xs opacity-85 font-medium pt-3" id="payment-invoice-lines">
                        <div>Date: {selectedEvent.date}</div>
                        <div>Seats Booked: {selectedSeatsCount} ticket(s)</div>
                        <div>Seat Indices: {selectedSeatsMap.map(s => s + 1).join(', ')}</div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/15" id="payment-invoice-gross">
                      <div className="text-[10px] opacity-60 uppercase tracking-wide">Total Payment Due</div>
                      <div className="text-3xl font-black text-[#FFD700] mt-1">₹{selectedEvent.ticketPrice * selectedSeatsCount}</div>
                      <div className="text-[10px] text-green-400 mt-1 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Secure Payment Simulated Integration
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Credit card fields */}
                  <div className="md:col-span-7 p-6 sm:p-8 space-y-6" id="payment-gateway-form">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <CardIcon className="w-5 h-5 text-purple-600" />
                      <h3 className="font-extrabold text-sm text-slate-800">Card payment details</h3>
                    </div>

                    {/* PREMIUM VISUAL CARD DRAWING */}
                    <div className="bg-gradient-to-br from-purple-800 to-indigo-950 text-white rounded-xl p-4 shadow-xl relative overflow-hidden h-36 flex flex-col justify-between" id="premium-visual-card">
                      <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-4 -translate-y-4">
                        <DollarSign className="w-32 h-32" />
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono tracking-widest opacity-60">ACADEMIC SECURE GATE</span>
                        <div className="w-8 h-6 bg-yellow-400/20 border border-yellow-400/30 rounded" />
                      </div>

                      {/* Card Number drawing */}
                      <div className="text-sm font-mono tracking-widest text-[#FFD700] select-all my-2">
                        {paymentCardNumber || '•••• •••• •••• ••••'}
                      </div>

                      <div className="flex justify-between items-end text-[9px] font-mono">
                        <div>
                          <div className="opacity-50 text-[7px] uppercase">Card Holder</div>
                          <div className="truncate max-w-[120px] font-bold">{paymentCardName || 'STUDENT NAME'}</div>
                        </div>
                        <div className="text-right">
                          <div className="opacity-50 text-[7px] uppercase">Expires</div>
                          <div className="font-bold">{paymentExpiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Real Input Fields */}
                    <form onSubmit={handleSimulatedCardSubmit} className="space-y-4 text-xs" id="credit-card-form">
                      
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Cardholder Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sameer Rao" 
                          value={paymentCardName}
                          onChange={(e) => setPaymentCardName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">16-Digit Card Number</label>
                        <input 
                          type="text" 
                          maxLength={19}
                          placeholder="4111 2222 3333 4444" 
                          value={paymentCardNumber}
                          onChange={(e) => {
                            // auto space formatting
                            let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            let matches = val.match(/\d{4,16}/g);
                            let match = matches && matches[0] || '';
                            let parts = [];
                            for (let i=0, len=match.length; i<len; i+=4) {
                              parts.push(match.substring(i, i+4));
                            }
                            if (parts.length > 0) {
                              setPaymentCardNumber(parts.join(' '));
                            } else {
                              setPaymentCardNumber(val);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-mono font-semibold"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Expiry (MM/YY)</label>
                          <input 
                            type="text" 
                            maxLength={5}
                            placeholder="12/28" 
                            value={paymentExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^0-9/]/g, '');
                              if (val.length === 2 && !val.includes('/')) {
                                val += '/';
                              }
                              setPaymentExpiry(val);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold text-center"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">CVV Code</label>
                          <input 
                            type="password" 
                            maxLength={3}
                            placeholder="***" 
                            value={paymentCvv}
                            onChange={(e) => setPaymentCvv(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold text-center"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        <Check className="w-4 h-4" />
                        <span>Authorize Simulated Payment Transaction</span>
                      </button>

                    </form>
                  </div>

                </div>

              </div>
            )}

            {/* 6. CONFIRMATION PAGE WITH QR CODE GENERATION */}
            {currentView === 'confirmation' && confirmedBooking && (
              <div className="max-w-xl mx-auto my-6 space-y-6 text-center" id="confirmation-view-stage">
                
                {/* Header state */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-2 shadow-sm" id="confirmation-header-success">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-800">Booking Successfully Completed! 🎉</h2>
                  <p className="text-xs text-emerald-600">Your campus admission pass is validated and live. Present the QR code below at the venue.</p>
                </div>

                {/* VISUAL PASS TICKET BOARD */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden text-left relative" id="ticket-pass-board">
                  
                  {/* Decorative cutouts to look like a ticket */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#F8FAFC] border-r-2 border-slate-200 rounded-r-full" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-[#F8FAFC] border-l-2 border-slate-200 rounded-l-full" />
                  
                  {/* Category Gradient strip */}
                  <div className="h-4 bg-[#6C3EB8]" />

                  {/* Pass fields */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6" id="ticket-pass-contents">
                    
                    <div className="md:col-span-8 space-y-4">
                      <span className="text-[9px] uppercase font-bold text-purple-600 tracking-widest">ADMISSION BOARDING PASS</span>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">{confirmedBooking.eventTitle}</h3>
                      
                      {/* Grid info details */}
                      <div className="grid grid-cols-2 gap-4 text-xs pt-2" id="ticket-grid-details">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendee</div>
                          <div className="font-extrabold text-slate-700">{confirmedBooking.userName}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date / Time</div>
                          <div className="font-extrabold text-slate-700">{confirmedBooking.eventDate}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Seats Count</div>
                          <div className="font-extrabold text-purple-700 font-mono">{confirmedBooking.seatsCount} VIP Entry</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking ID</div>
                          <div className="font-extrabold text-slate-700 font-mono select-all">{confirmedBooking.id}</div>
                        </div>
                      </div>

                      {confirmedPayment && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex justify-between items-center text-[11px]" id="ticket-payment-details">
                          <span className="text-slate-500 font-medium">Payment status: <b className="text-emerald-600">CONFIRMED</b></span>
                          <span className="text-slate-400 font-mono">Card: {confirmedPayment.cardNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code container */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-dashed border-slate-200" id="ticket-qr-section">
                      
                      {/* Generated image tag from API */}
                      <img 
                        src={confirmedBooking.qrCodeUrl} 
                        alt="Booking Ticket QR Code" 
                        className="w-36 h-36 border border-slate-200 rounded-lg shadow-sm"
                        id="live-qr-image"
                      />
                      
                      <span className="text-[8px] font-bold text-slate-400 uppercase mt-2 tracking-widest text-center">SCAN AT VERIFICATION GATE</span>
                    </div>

                  </div>

                </div>

                {/* Footer download buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2" id="confirmation-actions">
                  <button 
                    onClick={handlePrintTicket}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                    id="download-print-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Print Boarding Pass</span>
                  </button>

                  <button 
                    onClick={() => setCurrentView('home')}
                    className="px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all"
                    id="return-discover-btn"
                  >
                    Explore More Events
                  </button>
                </div>

              </div>
            )}

            {/* 7. USER BOOKINGS DASHBOARD */}
            {currentView === 'bookings' && (
              <div className="space-y-6" id="bookings-view-stage">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">My Platform Bookings</h2>
                  <p className="text-xs text-slate-500">Track and download admission passes for your registered campus events.</p>
                </div>

                {myBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto" id="no-bookings-card">
                    <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-700">You haven't booked any event tickets yet</h3>
                    <p className="text-xs text-slate-400 mt-1">Explore available listings and book seats to start tracking history.</p>
                    <button 
                      onClick={() => setCurrentView('home')}
                      className="mt-4 px-4 py-2 bg-[#6C3EB8] text-white rounded-xl text-xs font-bold shadow-md hover:bg-purple-700 transition-all"
                    >
                      Book Your First Event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4" id="bookings-list">
                    {myBookings.map((b) => (
                      <div 
                        key={b.id} 
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        id={`user-booking-item-${b.id}`}
                      >
                        <div className="space-y-2 flex-1 min-w-0" id={`user-booking-meta-${b.id}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full font-bold uppercase">
                              Booking ID: #{b.id}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                              b.status === 'checked_in' 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {b.status === 'checked_in' ? 'Checked In ✅' : 'Confirmed Booking 🎫'}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-sm text-slate-800 leading-tight truncate">{b.eventTitle}</h3>
                          
                          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 font-medium" id={`user-booking-subtext-${b.id}`}>
                            <span>📅 Date: {b.eventDate}</span>
                            <span>👥 Seats Reserved: {b.seatsCount} VIP entries</span>
                            <span>💵 Total Amount: ₹{b.totalPrice}</span>
                          </div>
                        </div>

                        {/* QR Code preview + print triggers */}
                        <div className="flex items-center gap-4 shrink-0" id={`user-booking-actions-${b.id}`}>
                          <img 
                            src={b.qrCodeUrl} 
                            alt="Booking code representation" 
                            className="w-16 h-16 border border-slate-200 rounded-lg shadow-xs pointer-events-none"
                          />

                          <div className="space-y-2" id={`user-booking-action-buttons-${b.id}`}>
                            <button 
                              onClick={() => {
                                setConfirmedBooking(b);
                                setConfirmedPayment(null); // skip card drawing for historical
                                setCurrentView('confirmation');
                              }}
                              className="w-full px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                              id={`view-pass-btn-${b.id}`}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>View Pass</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* 8. ADMIN ANALYTICS DASHBOARD - "High Density" Theme Design */}
            {currentView === 'admin_dashboard' && currentUser?.role === 'admin' && (
              <div className="space-y-6" id="admin-dashboard-stage">
                
                {/* Dashboard title row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <span>Unified Admin Analytics Console</span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 font-extrabold uppercase">Admin Control</span>
                    </h2>
                    <p className="text-xs text-slate-500">Track registrations, seat sales, ticket revenues, and real-time venue check-ins.</p>
                  </div>

                  <button 
                    onClick={fetchAdminStats}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    id="refresh-stats-btn"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synchronize Database</span>
                  </button>
                </div>

                {/* 4 OVERVIEW STATS CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard-grid">
                  
                  {/* Card 1: Total Events */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="stat-card-events">
                    <div className="absolute right-0 top-0 text-purple-100 transform translate-x-2 -translate-y-2">
                      <Calendar className="w-16 h-16" />
                    </div>
                    <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Total Active Events</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">{adminStats.totalEvents}</div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">Live Active Listing</span>
                  </div>

                  {/* Card 2: Total Tickets Sold */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="stat-card-tickets">
                    <div className="absolute right-0 top-0 text-purple-100 transform translate-x-2 -translate-y-2">
                      <Ticket className="w-16 h-16" />
                    </div>
                    <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Total Tickets Sold</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">{adminStats.totalTicketsSold}</div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">Across all events</span>
                  </div>

                  {/* Card 3: Total Revenue */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="stat-card-revenue">
                    <div className="absolute right-0 top-0 text-purple-100 transform translate-x-2 -translate-y-2">
                      <DollarSign className="w-16 h-16" />
                    </div>
                    <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Gross Revenue Generated</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-2">₹{adminStats.totalRevenue}</div>
                    <span className="text-[9px] font-bold text-[#FFD700] bg-slate-900 px-2 py-0.5 rounded-full mt-1.5 inline-block font-mono">100% Academic Yield</span>
                  </div>

                  {/* Card 4: Total Checked In */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden" id="stat-card-checkedin">
                    <div className="absolute right-0 top-0 text-purple-100 transform translate-x-2 -translate-y-2">
                      <QrCode className="w-16 h-16" />
                    </div>
                    <div className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Attendees Checked-In</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{adminStats.totalAttendeesCheckedIn}</div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 inline-block">Gate Verified</span>
                  </div>

                </div>

                {/* VISUAL CHARTS WRAPPER GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-dashboard-grid">
                  
                  {/* Left: Bar chart & Line chart */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Bar Chart card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Tickets Sold per Campus Event</h3>
                      {adminCharts.ticketsSoldPerEvent.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400 font-semibold">No tickets sold data available yet</div>
                      ) : (
                        <BarChart data={adminCharts.ticketsSoldPerEvent} />
                      )}
                    </div>

                    {/* Line Chart card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Booking Activity Timeline (Last 7 Days)</h3>
                      <LineChart data={adminCharts.bookingsOverTime} />
                    </div>

                  </div>

                  {/* Right: Pie Chart category distribution */}
                  <div className="lg:col-span-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between" id="pie-card-container-wrapper">
                      <div>
                        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-6">Events Category Weight distribution</h3>
                        <PieChart data={adminCharts.eventsByCategory} />
                      </div>

                      <div className="pt-6 border-t border-slate-100 mt-6" id="pie-additional-meta">
                        <span className="text-[10px] text-slate-400 leading-relaxed block text-center font-medium">
                          Categories represent academic classifications managed within the system portal database.
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* TABLE OF RECENT TRANSACTIONS BOOKINGS */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="recent-bookings-table-wrapper">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">Recent Platform Ticket Bookings</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">Live Transaction stream</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" id="admin-recent-bookings-table">
                      <thead>
                        <tr className="bg-slate-100 text-[10px] uppercase text-slate-500 font-bold border-b border-slate-200">
                          <th className="px-6 py-3">Booking ID</th>
                          <th className="px-6 py-3">Attendee Name</th>
                          <th className="px-6 py-3">Target Event</th>
                          <th className="px-6 py-3 text-center">Seats Reserved</th>
                          <th className="px-6 py-3">Paid Amount</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {adminCharts.recentBookings.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold font-mono">No recent transaction bookings recorded</td>
                          </tr>
                        ) : (
                          adminCharts.recentBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors" id={`row-booking-${b.id}`}>
                              <td className="px-6 py-4 font-mono font-bold text-purple-700 select-all">#{b.id}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{b.userName}</td>
                              <td className="px-6 py-4 text-slate-600 truncate max-w-[180px]" title={b.eventTitle}>{b.eventTitle}</td>
                              <td className="px-6 py-4 text-center font-bold text-slate-700">{b.seatsCount} Seats</td>
                              <td className="px-6 py-4 font-bold text-slate-950">₹{b.totalPrice}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                  b.status === 'checked_in' 
                                    ? 'bg-green-50 text-green-700 border-green-100' 
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {b.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 9. ADMIN EVENTS MANAGE PAGE */}
            {currentView === 'admin_events' && currentUser?.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-events-stage">
                
                {/* Left Column: Create / Edit Event Form */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4 h-fit">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <h3 className="font-extrabold text-sm text-slate-800">
                      {isEditingEvent ? '✍️ Modify Event Information' : '➕ Construct New Event'}
                    </h3>
                    {isEditingEvent && (
                      <button 
                        onClick={resetEventForm}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 px-2 py-1 rounded font-bold"
                        id="form-cancel-edit"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleCreateOrEditEvent} className="space-y-4 text-xs" id="event-builder-form">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Event Title Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Symphony Concert Night" 
                        value={eventFormTitle}
                        onChange={(e) => setEventFormTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Narrative Description</label>
                      <textarea 
                        rows={3}
                        placeholder="Detailed outline of the event topic agenda, keynote speakers, or musical setlists..." 
                        value={eventFormDesc}
                        onChange={(e) => setEventFormDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 leading-normal"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Date</label>
                        <input 
                          type="date" 
                          value={eventFormDate}
                          onChange={(e) => setEventFormDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 text-center font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Start Time</label>
                        <input 
                          type="time" 
                          value={eventFormTime}
                          onChange={(e) => setEventFormTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 text-center font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Campus Venue / Location</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Auditorium Hall A" 
                          value={eventFormVenue}
                          onChange={(e) => setEventFormVenue(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Category Classification</label>
                        <select 
                          value={eventFormCategory}
                          onChange={(e) => setEventFormCategory(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 font-semibold"
                        >
                          <option value="Tech">Tech</option>
                          <option value="Music">Music</option>
                          <option value="Business">Business</option>
                          <option value="Sports">Sports</option>
                          <option value="Education">Education</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Total Seats Capacity</label>
                        <input 
                          type="number" 
                          min={1}
                          value={eventFormSeats}
                          onChange={(e) => setEventFormSeats(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 text-center font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Ticket Ticket Price (₹)</label>
                        <input 
                          type="number" 
                          min={0}
                          placeholder="0 for Free" 
                          value={eventFormPrice}
                          onChange={(e) => setEventFormPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-purple-600 text-center font-semibold"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-[#6C3EB8] hover:bg-purple-700 text-[#FFD700] font-bold rounded-xl shadow-lg shadow-purple-600/10 transition-all flex items-center justify-center gap-2"
                      id="event-form-submit-btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isEditingEvent ? 'Commit Modification' : 'Deploy Event to Database'}</span>
                    </button>

                  </form>
                </div>

                {/* Right Column: Active Event List with Edit / Delete actions */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="admin-events-list">
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">Deplooyed Database Events ({events.length})</h3>
                  </div>

                  <div className="divide-y divide-slate-150 text-xs" id="admin-events-records">
                    {events.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 font-semibold font-mono">No active events found in database json</div>
                    ) : (
                      events.map((evt) => (
                        <div 
                          key={evt.id} 
                          className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                          id={`admin-evt-item-${evt.id}`}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5" id={`admin-evt-meta-${evt.id}`}>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${getCategoryBadgeClass(evt.category)}`}>
                                {evt.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">#{evt.id}</span>
                            </div>

                            <h4 className="font-extrabold text-slate-800 truncate text-sm">{evt.title}</h4>
                            
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium" id={`admin-evt-details-${evt.id}`}>
                              <span>📅 Date: {evt.date}</span>
                              <span>Venue: {evt.venue}</span>
                              <span>Price: <b className="text-purple-700">₹{evt.ticketPrice}</b></span>
                              <span>Seats: <b className="text-slate-700">{evt.availableSeats}</b> / {evt.totalSeats} remaining</span>
                            </div>
                          </div>

                          {/* Trigger actions */}
                          <div className="flex gap-2 shrink-0" id={`admin-evt-actions-${evt.id}`}>
                            <button 
                              onClick={() => startEditEvent(evt)}
                              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 rounded-lg transition-all"
                              title="Modify details"
                              id={`edit-evt-btn-${evt.id}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-350 text-rose-600 rounded-lg transition-all"
                              title="Delete event"
                              id={`delete-evt-btn-${evt.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 10. ADMIN CHECK-IN SYSTEM SCANNER */}
            {currentView === 'admin_checkin' && currentUser?.role === 'admin' && (
              <div className="max-w-2xl mx-auto my-6 space-y-6" id="admin-checkin-stage">
                
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6" id="gate-verifier-box">
                  <div className="text-center space-y-2 border-b border-slate-100 pb-5">
                    <QrCode className="w-12 h-12 text-[#6C3EB8] mx-auto" />
                    <h2 className="text-lg font-bold text-slate-800">Campus Entry Verification Gate</h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Scan or manually input a student booking ID to check admissions validation instantly in the database.
                    </p>
                  </div>

                  {/* Manual Type Box */}
                  <form onSubmit={handleCheckinVerification} className="space-y-4 max-w-md mx-auto" id="gate-checkin-form">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Type Booking Ticket ID</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. bk_xxxxxxxxx" 
                          value={checkinId}
                          onChange={(e) => setCheckinId(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#6C3EB8] text-sm"
                          required
                          id="checkin-id-input"
                        />
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-[#6C3EB8] hover:bg-purple-700 text-[#FFD700] font-bold rounded-xl shadow-lg shadow-purple-600/10 transition-all flex items-center gap-1.5"
                          id="checkin-submit-btn"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Verify Ticket</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* SCANNING RESULTS BOX */}
                  {checkinResult && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 max-w-md mx-auto transition-all animate-fade-in" id="checkin-results-panel">
                      
                      {checkinResult.status === 'success' && (
                        <div className="text-center space-y-4" id="checkin-result-success">
                          <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                            ✓
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wider">{checkinResult.message}</h4>
                            <p className="text-[11px] text-slate-400">Database Entry Updated successfully. Seat cleared at Gate admission.</p>
                          </div>

                          {checkinResult.booking && (
                            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-left space-y-1.5 text-xs font-medium text-slate-600" id="checkin-user-receipt">
                              <div><b>Event Name:</b> {checkinResult.booking.eventTitle}</div>
                              <div><b>Attendee:</b> {checkinResult.booking.userName}</div>
                              <div><b>Seats Reserved:</b> {checkinResult.booking.seatsCount} VIP Entrance</div>
                              <div className="text-[10px] text-slate-400 font-mono"><b>Booking ID:</b> {checkinResult.booking.id}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {checkinResult.status === 'checked_in' && (
                        <div className="text-center space-y-4" id="checkin-result-warning">
                          <div className="w-10 h-10 bg-yellow-400 text-purple-900 rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                            ⚠️
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-yellow-800 uppercase tracking-wider">{checkinResult.message}</h4>
                            <p className="text-[11px] text-slate-400">Notice: Student ticket holder has already completed gate verification.</p>
                          </div>

                          {checkinResult.booking && (
                            <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 text-left space-y-1.5 text-xs font-medium text-slate-600" id="checkin-warning-receipt">
                              <div><b>Event Name:</b> {checkinResult.booking.eventTitle}</div>
                              <div><b>Attendee:</b> {checkinResult.booking.userName}</div>
                              <div><b>Booking ID:</b> {checkinResult.booking.id}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {checkinResult.status === 'error' && (
                        <div className="text-center space-y-4" id="checkin-result-error">
                          <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto text-lg font-bold shadow-md">
                            ✕
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-rose-700 uppercase tracking-wider">{checkinResult.message}</h4>
                            <p className="text-[11px] text-rose-500">Validation Error: ID does not match any booked seats in our database registries.</p>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Short instructions disclosures */}
                  <div className="bg-slate-50 rounded-xl p-4 text-[11px] text-slate-500 leading-normal max-w-md mx-auto" id="gate-instruction-disclosure">
                    <p className="font-bold mb-1">💡 Pro-Tip for demonstration:</p>
                    <p>Go to your <b className="text-purple-600">"My Bookings"</b> page, click "View Pass" on any ticket, copy the booking ID (or check recent bookings in the dashboard), and paste it here to test real successful check-in states!</p>
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* MAIN PLATFORM FOOTER */}
          <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-[11px] text-slate-400 font-semibold tracking-wider flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 shadow-inner" id="main-footer">
            <span>© 2026 EventHub PRO Platform. All Rights Reserved.</span>
            <div className="flex gap-4" id="footer-links">
              <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="hover:text-purple-600 transition-colors">Home Page</a>
              <span>•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); fetchEvents(); }} className="hover:text-purple-600 transition-colors">Force Sync DB</a>
              <span>•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); alert('Academic Event Management system developed for graduation project demonstration.'); }} className="hover:text-purple-600 transition-colors">Developer Info</a>
            </div>
          </footer>

        </main>
      </div>

    </div>
  );
}
