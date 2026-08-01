import React, { useState, useEffect } from 'react'; 
import axios from 'axios';               
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; 
import { jsPDF } from 'jspdf'; 
import './App.css';                      

function HomeView() {
  return (
    <div>
      <div className="ticket-card" style={{ borderLeft: '4px solid var(--accent)' }}>
        <h2>🏢 About Our Shop</h2>
        <p><strong>Location:</strong> 123 Tech Avenue, Katuneriya, Sri Lanka</p>
        <p><strong>Phone:</strong> +94 77 8868106</p>
        <p><strong>Working Hours:</strong> Monday - Saturday (9:00 AM - 6:00 PM)</p>
        <p style={{ color: 'var(--text2)' }}>Welcome to our premier Computer Repair and Service Management System. We specialize in fast, reliable, and professional device repairs.</p>
      </div>

      <div className="ticket-card" style={{ borderLeft: '4px solid var(--green)' }}>
        <h2>👨‍💻 Meet Our Expert Technicians</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ padding: '15px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border2)' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Sadun Angelo</h3>
            <p style={{ margin: 0, color: 'var(--text2)' }}>Lead Electrical & Information Engineer</p>
          </div>
          <div style={{ padding: '15px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border2)' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>Kasun Perera</h3>
            <p style={{ margin: 0, color: 'var(--text2)' }}>Hardware & Motherboard Specialist</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerView({ fetchTickets }) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [comments, setComments] = useState('');
  
  // NEW: State for Received Date (Defaults to today's date)
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);

  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [latestTicket, setLatestTicket] = useState(null); 

  const submitTicket = async (event) => {
    event.preventDefault(); 
    const newTicket = { customerName, address, phone, device, issue, comments, receivedDate };
    
    try {
      await axios.post('http://localhost:5000/api/tickets', newTicket);
      setLatestTicket(newTicket); 
      setCustomerName(''); setAddress(''); setPhone(''); 
      setDevice(''); setIssue(''); setComments('');
      fetchTickets(); 
    } catch (error) {
      alert('Error submitting ticket.');
    }
  };

  const downloadPDF = () => {
    if (!latestTicket) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); 
    doc.text("Computer Repair and Service Management System", 20, 20);
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text(`Received Date: ${latestTicket.receivedDate}`, 20, 35);
    doc.text(`Customer Name: ${latestTicket.customerName}`, 20, 45);
    doc.text(`Address: ${latestTicket.address}`, 20, 55);
    doc.text(`Phone Number: ${latestTicket.phone}`, 20, 65);
    doc.text(`Device: ${latestTicket.device}`, 20, 75);
    doc.text(`Reported Problem: ${latestTicket.issue}`, 20, 85);
    doc.text(`Additional Comments: ${latestTicket.comments || 'None'}`, 20, 95);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Thank you for choosing us! You can track your repair status anytime", 20, 115);
    doc.text("on our website using your Name.", 20, 122);
    doc.save(`${latestTicket.customerName}_Repair_Ticket.pdf`);
  };

  const trackDevice = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5000/api/tickets/search/${searchName}`);
      setSearchResults(response.data);
      setHasSearched(true);
    } catch (error) {
      alert("Error finding your ticket.");
    }
  };

  return (
    <div>
      <h2>Submit your device below for repair.</h2>
      
      <form onSubmit={submitTicket} className="custom-form" style={{ marginBottom: '15px' }}>
        <input type="text" placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <input type="text" placeholder="Home Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <input type="tel" placeholder="Telephone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Device (e.g., HP Laptop)" value={device} onChange={(e) => setDevice(e.target.value)} required />
        
        {/* NEW CALENDAR FIELD FOR RECEIVED DATE */}
        <label style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 'bold' }}>
          Received Order Date:
          <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} style={{ marginTop: '5px' }} required />
        </label>

        <textarea placeholder="What is the main problem?" value={issue} onChange={(e) => setIssue(e.target.value)} rows="3" required />
        <textarea placeholder="Any other comments or passwords we should know?" value={comments} onChange={(e) => setComments(e.target.value)} rows="2" />
        <button type="submit" className="btn-primary">Submit Request</button>
      </form>

      {latestTicket && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '30px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 15px 0', color: 'var(--green)', fontWeight: 'bold', fontSize: '18px' }}>
            ✅ Success! Your device has been submitted.
          </p>
          <button onClick={downloadPDF} className="btn-success">
            📥 Download PDF Receipt
          </button>
        </div>
      )}

      <hr />

      <h2>🔍 Track My Device</h2>
      <form onSubmit={trackDevice} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input type="text" placeholder="Enter your name to track status" value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ flex: 1 }} required />
        <button type="submit" className="btn-success">Track</button>
      </form>

      {hasSearched && searchResults.length === 0 && (
        <p style={{ color: 'var(--red)', fontWeight: '600' }}>No repairs found.</p>
      )}

      {searchResults.map((ticket) => (
         <div key={ticket._id} className="ticket-card" style={{ borderLeft: '4px solid var(--green)' }}>
           <h3>{ticket.customerName} - {ticket.device}</h3>
           <p><strong>Received Date:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.receivedDate}</span></p>
           <p><strong>Status:</strong> <span className="status-badge">{ticket.status}</span></p>
           <p><strong>Assigned Tech:</strong> {ticket.assignedTechnician}</p>
           <p><strong>Parts Required:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.partsUsed}</span></p>
           <p><strong>Estimated Cost:</strong> <span style={{ color: 'var(--text2)'}}>Rs. {ticket.estimatedCost}</span></p>
           <p><strong>Estimated Completion Date:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.estimatedTime}</span></p>
         </div>
      ))}
    </div>
  );
}

function AdminLogin({ setIsAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else setError('Incorrect password. Access denied.');
  };

  return (
    <div className="ticket-card" style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2>🔒 Technician Login</h2>
      <form onSubmit={handleLogin} className="custom-form" style={{ marginTop: '20px' }}>
        <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="btn-danger">Login to Dashboard</button>
      </form>
      {error && <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>{error}</p>}
    </div>
  );
}

function TechnicianView({ ticketList, fetchTickets, setIsAuthenticated }) {
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editTech, setEditTech] = useState('');
  const [editParts, setEditParts] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editTime, setEditTime] = useState('');

  const startEditing = (ticket) => {
    setEditingId(ticket._id); 
    setEditStatus(ticket.status);
    setEditTech(ticket.assignedTechnician);
    setEditParts(ticket.partsUsed);
    setEditCost(ticket.estimatedCost);
    setEditTime(ticket.estimatedTime);
  };

  const saveUpdate = async (id) => {
    const updatedData = { status: editStatus, assignedTechnician: editTech, partsUsed: editParts, estimatedCost: editCost, estimatedTime: editTime };
    try {
      await axios.put(`http://localhost:5000/api/tickets/${id}`, updatedData);
      setEditingId(null); 
      fetchTickets();     
    } catch (error) {
      alert("Error updating the ticket!");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📋 Active Repair Jobs</h2>
        <button onClick={() => setIsAuthenticated(false)} className="btn-dark">Logout</button>
      </div>
      
      {ticketList.length === 0 ? <p style={{ color: 'var(--text2)' }}>No repairs pending right now!</p> : ticketList.map((ticket) => (
        <div key={ticket._id} className="ticket-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: '0' }}>{ticket.customerName} - {ticket.device}</h3>
            <span style={{ fontSize: '14px', color: 'var(--text3)' }}>📞 {ticket.phone || 'N/A'}</span>
          </div>
          <p style={{ margin: '5px 0' }}><strong>Received Date:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.receivedDate || 'N/A'}</span></p>
          <p style={{ margin: '5px 0' }}><strong>Address:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.address || 'N/A'}</span></p>
          <p style={{ margin: '5px 0' }}><strong>Problem:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.issue}</span></p>
          <p style={{ margin: '5px 0 15px 0', fontStyle: 'italic', color: 'var(--text3)' }}><strong>Notes:</strong> {ticket.comments || 'None'}</p>
          <hr />

          {editingId === ticket._id ? (
            <div className="custom-form">
              <label style={{ color: 'var(--text2)', fontWeight: 'bold' }}>Status:
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ marginTop: '5px' }}>
                  <option value="Pending">Pending</option>
                  <option value="Diagnosing">Diagnosing</option>
                  <option value="Waiting on Parts">Waiting on Parts</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <input type="text" placeholder="Assigned Technician" value={editTech} onChange={(e) => setEditTech(e.target.value)} />
              <input type="text" placeholder="Parts Used" value={editParts} onChange={(e) => setEditParts(e.target.value)} />
              <input type="number" placeholder="Estimated Cost" value={editCost} onChange={(e) => setEditCost(e.target.value)} />
              
              {/* NEW CALENDAR FIELD FOR ESTIMATED COMPLETION DATE */}
              <label style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 'bold' }}>
                Estimated Completion Date:
                <input type="date" value={editTime} onChange={(e) => setEditTime(e.target.value)} style={{ marginTop: '5px' }} />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => saveUpdate(ticket._id)} className="btn-success">Save Ticket</button>
                <button onClick={() => setEditingId(null)} className="btn-danger">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <p><strong>Status:</strong> <span className="status-badge">{ticket.status}</span></p>
              <p><strong>Assigned Tech:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.assignedTechnician}</span></p>
              <p><strong>Parts Logged:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.partsUsed}</span></p>
              <p><strong>Est. Cost:</strong> <span style={{ color: 'var(--text2)'}}>Rs. {ticket.estimatedCost}</span></p>
              <p><strong>Est. Completion Date:</strong> <span style={{ color: 'var(--text2)'}}>{ticket.estimatedTime}</span></p>
              <button onClick={() => startEditing(ticket)} className="btn-secondary" style={{ marginTop: '15px' }}>Edit Ticket</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [ticketList, setTicketList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  const fetchTickets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tickets');
      setTicketList(response.data); 
    } catch (error) {
      console.log('Error fetching tickets:', error);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  return (
    <Router>
      <div className="app-container">
        
        <h1 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>🛠️ Computer Repair and Service Management System </h1>
        
       <nav className="main-nav">
          <Link to="/" className="nav-link home">Home</Link>
          <Link to="/customer" className="nav-link customer">Customer Portal</Link>
          <Link to="/admin" className="nav-link admin">Technician Admin</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/customer" element={<CustomerView fetchTickets={fetchTickets} />} />
          <Route path="/admin" element={
            isAuthenticated ? (
              <TechnicianView ticketList={ticketList} fetchTickets={fetchTickets} setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <AdminLogin setIsAuthenticated={setIsAuthenticated} />
            )
          } />
        </Routes>

      </div>
    </Router>
  );
}

export default App;