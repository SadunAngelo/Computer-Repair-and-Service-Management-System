// =======================================================
// 1. IMPORTING DEPENDENCIES & DNS CONFIGURATION
// =======================================================
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// =======================================================
// 2. CONNECT TO DATABASE & SEED INITIAL ENTITIES
// =======================================================
const myDatabaseLink = 'mongodb://pereraangelo578_db_user:xTNmdcAOrBNbHzSx@ac-x5np9ev-shard-00-00.dh8jwc5.mongodb.net:27017,ac-x5np9ev-shard-00-01.dh8jwc5.mongodb.net:27017,ac-x5np9ev-shard-00-02.dh8jwc5.mongodb.net:27017/?ssl=true&replicaSet=atlas-10wx1n-shard-0&authSource=admin&appName=Cluster0';

mongoose.connect(myDatabaseLink)
  .then(async () => {
    console.log('Database Connected Successfully!');
    await seedTechnicians();
  })
  .catch((err) => console.log('Database Error: ', err));

// =======================================================
// 3. DATABASE SCHEMAS & RELATIONSHIPS
// =======================================================

// Entity 1: Technician Schema (Referenced Entity)
const technicianBlueprint = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true },
  phone: { type: String, required: true }
});
const Technician = mongoose.model('Technician', technicianBlueprint);

// Entity 2: Ticket Schema with Relationship, Soft Deletion Flag & Updated Enum
const ticketBlueprint = new mongoose.Schema({
  trackingId: { 
    type: String, 
    unique: true, 
    required: [true, 'Tracking ID is required'] 
  },
  customerName: { 
    type: String, 
    required: [true, 'Customer name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  address: { 
    type: String, 
    required: [true, 'Home address is required'],
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, 'Contact phone number is required'],
    match: [/^(?:0|94|\+94)?(7[0-9]{8})$/, 'Please enter a valid Sri Lankan mobile number (e.g., 0778868106)']
  },
  device: { 
    type: String, 
    required: [true, 'Device model is required'],
    trim: true 
  },
  issue: { 
    type: String, 
    required: [true, 'Reported issue description is required'] 
  },
  comments: { type: String, default: '' },
  receivedDate: { 
    type: String, 
    default: () => new Date().toISOString().split('T')[0] 
  },
  estimatedTime: { type: String, default: 'To Be Determined' },
  status: { 
    type: String, 
    enum: ['Pending', 'Diagnosing', 'Waiting on Parts', 'Completed', 'Cancelled'],
    default: 'Pending' 
  },
  // Relational Foreign Key reference to Technicians collection
  assignedTechnician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Technician',
    default: null 
  },
  partsUsed: { type: String, default: 'None yet' },
  estimatedCost: { 
    type: Number, 
    min: [0, 'Estimated cost cannot be negative'],
    default: 0 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  }
});
const Ticket = mongoose.model('Ticket', ticketBlueprint);

// Pre-populates technician directory if empty
async function seedTechnicians() {
  try {
    const count = await Technician.countDocuments();
    if (count === 0) {
      await Technician.insertMany([
        { name: 'Sadun Angelo', role: 'Lead Electrical & Information Engineer', phone: '+94 77 8868106' },
        { name: 'Kasun Perera', role: 'Hardware & Motherboard Specialist', phone: '+94 71 9965235' },
        { name: 'Sameera Bandara', role: 'IT Support & Firmware Specialist', phone: '+94 76 1234567' }
      ]);
      console.log('Seeded initial Technician staff into MongoDB.');
    }
  } catch (err) {
    console.error('Error seeding technicians:', err);
  }
}

// =======================================================
// 4. API ROUTES
// =======================================================

// 1. GET ALL TECHNICIANS
app.get('/api/technicians', async (req, res) => {
  try {
    const technicians = await Technician.find();
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch technicians" });
  }
});

// 2. GET ALL TICKETS (Populated with Technicians)
app.get('/api/tickets', async (req, res) => {
  try {
    const allTickets = await Ticket.find()
      .populate('assignedTechnician', 'name role phone')
      .sort({ _id: -1 });
    res.json(allTickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Failed to retrieve tickets" });
  }
});

// 3. CREATE A NEW TICKET
app.post('/api/tickets', async (req, res) => {
  try {
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const trackingId = `CR-${randomCode}`;

    const newTicket = new Ticket({
      ...req.body,
      trackingId: trackingId,
      isDeleted: false
    });

    await newTicket.save();
    console.log(`Created new ticket: ${trackingId}`);
    res.status(201).json(newTicket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error("Error creating ticket:", error);
    res.status(500).json({ error: "Internal server error saving ticket" });
  }
});

// 4. SEARCH TICKETS
app.get('/api/tickets/search/:query', async (req, res) => {
  try {
    const query = req.params.query.trim();
    const searchQuery = new RegExp(query, 'i');

    const foundTickets = await Ticket.find({
      $or: [
        { trackingId: query.toUpperCase() },
        { customerName: searchQuery }
      ]
    }).populate('assignedTechnician', 'name role phone');

    res.json(foundTickets);
  } catch (error) {
    console.error("Error searching tickets:", error);
    res.status(500).json({ error: "Error searching for ticket" });
  }
});

// 5. UPDATE TICKET
app.put('/api/tickets/:id', async (req, res) => {
  try {
    if (
      !req.body.assignedTechnician || 
      req.body.assignedTechnician === '' || 
      !mongoose.Types.ObjectId.isValid(req.body.assignedTechnician)
    ) {
      const matchingTech = await Technician.findOne({ name: req.body.assignedTechnician });
      req.body.assignedTechnician = matchingTech ? matchingTech._id : null;
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('assignedTechnician', 'name role phone');

    if (!updatedTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(updatedTicket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    console.error("Error updating ticket:", error);
    res.status(500).json({ error: "Error updating ticket" });
  }
});

// 6. SOFT DELETE TICKET (Moves to Deleted Archive Tab)
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const existingTicket = await Ticket.findById(req.params.id);
    if (!existingTicket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const archivedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: true,
        status: existingTicket.status === 'Completed' ? 'Completed' : 'Cancelled'
      },
      { new: true }
    );

    res.json({ message: "Ticket moved to deleted archive", ticket: archivedTicket });
  } catch (error) {
    console.error("Error archiving ticket:", error);
    res.status(500).json({ error: error.message || "Error archiving ticket" });
  }
});

// 7. RESTORE DELETED TICKET BACK TO ACTIVE BENCH
app.put('/api/tickets/restore/:id', async (req, res) => {
  try {
    const ticketToRestore = await Ticket.findById(req.params.id);
    if (!ticketToRestore) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const restoredStatus = ticketToRestore.status === 'Cancelled' ? 'Pending' : ticketToRestore.status;

    const restoredTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        isDeleted: false,
        status: restoredStatus 
      },
      { new: true }
    ).populate('assignedTechnician', 'name role phone');

    res.json({ message: "Ticket restored successfully", ticket: restoredTicket });
  } catch (error) {
    console.error("Error restoring ticket:", error);
    res.status(500).json({ error: error.message || "Error restoring ticket" });
  }
});

// 8. PERMANENT PURGE (Hard delete from database)
app.delete('/api/tickets/permanent/:id', async (req, res) => {
  try {
    const hardDeleted = await Ticket.findByIdAndDelete(req.params.id);
    if (!hardDeleted) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.json({ message: "Ticket permanently purged", id: req.params.id });
  } catch (error) {
    console.error("Error permanently deleting ticket:", error);
    res.status(500).json({ error: "Error permanently deleting ticket" });
  }
});

// =======================================================
// 5. START SERVER
// =======================================================
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
