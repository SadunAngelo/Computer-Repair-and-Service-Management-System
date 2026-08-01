// =======================================================
// 1. IMPORTING OUR TOOLS
// =======================================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// =======================================================
// 2. CONNECT TO DATABASE
// =======================================================
// IMPORTANT: I put your actual working link in here for you!
const myDatabaseLink = 'mongodb://pereraangelo578_db_user:xTNmdcAOrBNbHzSx@ac-x5np9ev-shard-00-00.dh8jwc5.mongodb.net:27017,ac-x5np9ev-shard-00-01.dh8jwc5.mongodb.net:27017,ac-x5np9ev-shard-00-02.dh8jwc5.mongodb.net:27017/?ssl=true&replicaSet=atlas-10wx1n-shard-0&authSource=admin&appName=Cluster0'; 

mongoose.connect(myDatabaseLink)
  .then(() => console.log('Database Connected Successfully!'))
  .catch((err) => console.log('Database Error: ', err));

// =======================================================
// 3. DATABASE BLUEPRINT
// =======================================================
// =======================================================
// 3. DATABASE BLUEPRINT
// =======================================================
const ticketBlueprint = new mongoose.Schema({
  // Expanded Customer Details
  customerName: String,
  address: String,
  phone: String,
  
  // Expanded Device Details
  device: String,
  issue: String,
  comments: String,
  
  // Technician Details
  receivedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  estimatedTime: { type: String, default: 'To Be Determined' },
  status: { type: String, default: 'Pending' },
  assignedTechnician: { type: String, default: 'Unassigned' },
  partsUsed: { type: String, default: 'None yet' },
  estimatedCost: { type: Number, default: 0 },
});

const Ticket = mongoose.model('Ticket', ticketBlueprint);

// =======================================================
// 4. OUR API ROUTES (THE MISSING PIECE!)
// =======================================================

// Gets all tickets to show on the screen
app.get('/api/tickets', async (req, res) => {
  const allTickets = await Ticket.find();
  res.json(allTickets);
});

// Receives the new ticket from the React form
app.post('/api/tickets', async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    await newTicket.save();
    res.json(newTicket);
  } catch (error) {
    res.status(500).send("Error saving ticket");
  }
});

// Updates an existing ticket (Technician adding parts, cost, or changing status)
app.put('/api/tickets/:id', async (req, res) => {
  try {
    // Finds the ticket by its unique ID and updates it with the new data sent from React
    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } // This tells the database to send back the newly updated version
    );
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).send("Error updating ticket");
  }
});
// Searches for a customer's ticket by their name
app.get('/api/tickets/search/:name', async (req, res) => {
  try {
    // We use a regular expression (RegExp) to make the search case-insensitive 
    // (so "Dasun" and "dasun" both work!)
    const searchQuery = new RegExp(req.params.name, 'i');
    const foundTickets = await Ticket.find({ customerName: searchQuery });
    res.json(foundTickets);
  } catch (error) {
    res.status(500).send("Error searching for ticket");
  }
});

// =======================================================
// 5. START SERVER
// =======================================================
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});