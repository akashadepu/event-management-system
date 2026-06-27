import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");
const JWT_SECRET = "evently_super_secure_academic_secret_2026_xyz";

// Ensure Express parses JSON
app.use(express.json());

// JSON DB Helper Functions
interface DbSchema {
  users: any[];
  events: any[];
  bookings: any[];
  payments: any[];
}

function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb: DbSchema = {
      users: [
        {
          id: "u_admin",
          email: "admin@evently.com",
          password: "password", // In a real app we'd hash, but for mock academic testing simple matches are perfect
          name: "Admin User",
          role: "admin"
        },
        {
          id: "u_user",
          email: "user@evently.com",
          password: "password",
          name: "John Doe",
          role: "user"
        }
      ],
      events: [
        {
          id: "ev_1",
          title: "Tech Summit 2025",
          description: "Discover the latest innovations in AI, Web3, and Cloud Computing with global industry leaders and developers.",
          date: "2026-07-10",
          time: "09:00",
          venue: "Hyderabad",
          category: "Tech",
          totalSeats: 200,
          availableSeats: 200,
          ticketPrice: 999
        },
        {
          id: "ev_2",
          title: "Music Fest Night",
          description: "Experience an electric night of live electronic music, indie bands, food trucks, and unforgettable memories.",
          date: "2026-07-15",
          time: "18:00",
          venue: "Mumbai",
          category: "Music",
          totalSeats: 500,
          availableSeats: 500,
          ticketPrice: 1499
        },
        {
          id: "ev_3",
          title: "Business Bootcamp",
          description: "An intensive masterclass on scaling startups, fundraising strategies, leadership, and product-market fit.",
          date: "2026-07-20",
          time: "10:00",
          venue: "Bangalore",
          category: "Business",
          totalSeats: 100,
          availableSeats: 100,
          ticketPrice: 2999
        },
        {
          id: "ev_4",
          title: "Sports Carnival",
          description: "Celebrate fitness, competitive spirit, and health with multi-discipline tournaments, relays, and interactive sports games.",
          date: "2026-07-25",
          time: "07:00",
          venue: "Delhi",
          category: "Sports",
          totalSeats: 1000,
          availableSeats: 1000,
          ticketPrice: 499
        },
        {
          id: "ev_5",
          title: "Education Expo",
          description: "Connect with world-class universities, academic advisors, career coaches, and scholarship opportunities globally.",
          date: "2026-08-01",
          time: "11:00",
          venue: "Chennai",
          category: "Education",
          totalSeats: 300,
          availableSeats: 300,
          ticketPrice: 0 // Free
        }
      ],
      bookings: [],
      payments: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
  }
}

initDb();

function readDb(): DbSchema {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file", err);
    return { users: [], events: [], bookings: [], payments: [] };
  }
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing to database file", err);
  }
}

// Custom JWT format using standard Node core 'crypto'
function generateToken(payload: { id: string; email: string; name: string; role: string }) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string) {
  try {
    const [header, data, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${data}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Authentication Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(403).json({ message: "Invalid or expired token" });

  req.user = decoded;
  next();
}

// Admin-only Middleware
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access restricted to administrators only" });
  }
  next();
}

// API ROUTES

// AUTHENTICATION
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  const db = readDb();
  const existingUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const newUser = {
    id: "u_" + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    password,
    role: "user" as const
  };

  db.users.push(newUser);
  writeDb(db);

  const tokenPayload = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
  const token = generateToken(tokenPayload);

  res.status(201).json({
    user: tokenPayload,
    token
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  const db = readDb();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const tokenPayload = { id: user.id, email: user.email, name: user.name, role: user.role };
  const token = generateToken(tokenPayload);

  res.json({
    user: tokenPayload,
    token
  });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// EVENTS API
app.get("/api/events", (req, res) => {
  const db = readDb();
  res.json(db.events);
});

app.post("/api/events", authenticateToken, requireAdmin, (req, res) => {
  const { title, description, date, time, venue, category, totalSeats, ticketPrice } = req.body;

  if (!title || !description || !date || !time || !venue || !category || totalSeats === undefined || ticketPrice === undefined) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const db = readDb();
  const newEvent = {
    id: "ev_" + Math.random().toString(36).substr(2, 9),
    title,
    description,
    date,
    time,
    venue,
    category,
    totalSeats: Number(totalSeats),
    availableSeats: Number(totalSeats),
    ticketPrice: Number(ticketPrice)
  };

  db.events.push(newEvent);
  writeDb(db);

  res.status(201).json(newEvent);
});

app.put("/api/events/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, venue, category, totalSeats, ticketPrice } = req.body;

  const db = readDb();
  const eventIdx = db.events.findIndex((e) => e.id === id);
  if (eventIdx === -1) {
    return res.status(444).json({ message: "Event not found" });
  }

  const originalEvent = db.events[eventIdx];
  const updatedTotalSeats = Number(totalSeats);
  const diffSeats = updatedTotalSeats - originalEvent.totalSeats;
  let newAvailable = originalEvent.availableSeats + diffSeats;
  if (newAvailable < 0) newAvailable = 0;

  db.events[eventIdx] = {
    ...originalEvent,
    title: title || originalEvent.title,
    description: description || originalEvent.description,
    date: date || originalEvent.date,
    time: time || originalEvent.time,
    venue: venue || originalEvent.venue,
    category: category || originalEvent.category,
    totalSeats: updatedTotalSeats,
    availableSeats: newAvailable,
    ticketPrice: Number(ticketPrice)
  };

  writeDb(db);
  res.json(db.events[eventIdx]);
});

app.delete("/api/events/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const eventExists = db.events.some((e) => e.id === id);
  if (!eventExists) {
    return res.status(404).json({ message: "Event not found" });
  }

  db.events = db.events.filter((e) => e.id !== id);
  writeDb(db);

  res.json({ message: "Event successfully deleted" });
});

// BOOKINGS API
app.get("/api/bookings/my", authenticateToken, (req: any, res) => {
  const db = readDb();
  const myBookings = db.bookings.filter((b) => b.userId === req.user.id);
  res.json(myBookings);
});

app.post("/api/bookings", authenticateToken, (req: any, res) => {
  const { eventId, seatsCount, paymentDetails } = req.body;

  if (!eventId || !seatsCount || seatsCount < 1) {
    return res.status(400).json({ message: "Invalid event or seat count" });
  }

  const db = readDb();
  const event = db.events.find((e) => e.id === eventId);
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (event.availableSeats < seatsCount) {
    return res.status(400).json({
      message: `Only ${event.availableSeats} seats are available for this event.`
    });
  }

  const requestedSeats = Number(seatsCount);
  const totalPrice = event.ticketPrice * requestedSeats;

  // Verify and record simulated card payment
  if (event.ticketPrice > 0) {
    if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv) {
      return res.status(400).json({ message: "Payment details are required for paid tickets" });
    }
  }

  // Deduct Seats
  event.availableSeats -= requestedSeats;

  const bookingId = "bk_" + Math.random().toString(36).substr(2, 9);
  const paymentId = "pay_" + Math.random().toString(36).substr(2, 9);

  // Generate a QR Code URL using api.qrserver.com
  const qrPayload = JSON.stringify({
    bookingId,
    name: req.user.name,
    event: event.title,
    seats: requestedSeats,
    date: event.date
  });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}`;

  const newBooking = {
    id: bookingId,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    userId: req.user.id,
    userName: req.user.name,
    seatsCount: requestedSeats,
    totalPrice,
    qrCodeUrl,
    status: "confirmed" as const,
    paymentId,
    bookedAt: new Date().toISOString()
  };

  // Mask card number for security logs
  const rawCard = paymentDetails?.cardNumber || "0000000000000000";
  const maskedCard = "**** **** **** " + rawCard.slice(-4);

  const newPayment = {
    id: paymentId,
    bookingId,
    userId: req.user.id,
    amount: totalPrice,
    cardNumber: maskedCard,
    date: new Date().toISOString().split("T")[0],
    status: "successful" as const
  };

  db.bookings.push(newBooking);
  db.payments.push(newPayment);
  writeDb(db);

  res.status(201).json({
    booking: newBooking,
    payment: newPayment
  });
});

// ADMIN CHECK-IN API
app.post("/api/bookings/verify", authenticateToken, requireAdmin, (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ message: "Booking ID is required" });
  }

  const db = readDb();
  const booking = db.bookings.find((b) => b.id.toLowerCase() === bookingId.trim().toLowerCase());

  if (!booking) {
    return res.status(404).json({ message: "Invalid Ticket ❌ (Booking not found)" });
  }

  if (booking.status === "checked_in") {
    return res.status(200).json({
      status: "checked_in",
      message: "Ticket already checked in ⚠️",
      booking
    });
  }

  // Update status to checked_in
  booking.status = "checked_in";
  writeDb(db);

  res.status(200).json({
    status: "success",
    message: "Valid Ticket ✅ (Check-in Successful)",
    booking
  });
});

// ADMIN ANALYTICS API
app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  const db = readDb();

  const totalEvents = db.events.length;
  const totalTicketsSold = db.bookings.reduce((sum, b) => sum + b.seatsCount, 0);
  const totalRevenue = db.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalAttendeesCheckedIn = db.bookings.filter((b) => b.status === "checked_in").reduce((sum, b) => sum + b.seatsCount, 0);

  // Tickets sold per event (Bar Chart data)
  const ticketsSoldPerEvent = db.events.map((event) => {
    const sold = db.bookings
      .filter((b) => b.eventId === event.id)
      .reduce((sum, b) => sum + b.seatsCount, 0);
    return {
      name: event.title,
      tickets: sold
    };
  });

  // Events by category (Pie Chart data)
  const categories = ["Music", "Tech", "Sports", "Business", "Education"];
  const eventsByCategory = categories.map((cat) => {
    const count = db.events.filter((e) => e.category === cat).length;
    return {
      category: cat,
      count
    };
  });

  // Bookings over last 7 days (Line Chart data)
  const bookingsOverTime = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD

    const bookingsCount = db.bookings.filter((b) => {
      const bookedDate = b.bookedAt.split("T")[0];
      return bookedDate === dateStr;
    }).length;

    // Format label as "Mon 23", "Tue 24" etc.
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    bookingsOverTime.push({
      date: dayLabel,
      bookings: bookingsCount
    });
  }

  // Sort bookings newest first for recent list
  const recentBookings = [...db.bookings]
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    .slice(0, 8);

  res.json({
    stats: {
      totalEvents,
      totalTicketsSold,
      totalRevenue,
      totalAttendeesCheckedIn
    },
    charts: {
      ticketsSoldPerEvent,
      eventsByCategory,
      bookingsOverTime,
      recentBookings
    }
  });
});

// Vite or Static Assets handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
