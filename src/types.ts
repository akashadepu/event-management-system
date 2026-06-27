export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venue: string;
  category: 'Music' | 'Tech' | 'Sports' | 'Business' | 'Education';
  totalSeats: number;
  availableSeats: number;
  ticketPrice: number; // 0 for Free
}

export interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  userId: string;
  userName: string;
  seatsCount: number;
  totalPrice: number;
  qrCodeUrl: string;
  status: 'confirmed' | 'checked_in';
  paymentId: string;
  bookedAt: string; // ISO string
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  cardNumber: string; // masked (e.g. **** **** **** 1234)
  date: string;
  status: 'successful';
}

export interface SystemStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalAttendeesCheckedIn: number;
}
