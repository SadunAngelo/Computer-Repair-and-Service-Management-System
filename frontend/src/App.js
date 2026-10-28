import React, { useState, useEffect, useCallback } from 'react'; 
import axios from 'axios';               
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; 
import { jsPDF } from 'jspdf'; 
import './App.css';   

const API_BASE = 'http://localhost:5000/api';

// Global technician directory with fallback mapping
const DEFAULT_TECHNICIANS = [
  { _id: 'tech-1', name: 'Sadun Angelo', role: 'Lead Electrical & Information Engineer' },
  { _id: 'tech-2', name: 'Kasun Perera', role: 'Hardware & Motherboard Specialist' },
  { _id: 'tech-3', name: 'Sameera Bandara', role: 'IT Support & Firmware Specialist' }
];

// Universal resolver to format technician details
const resolveTechnicianName = (techRef, customList = DEFAULT_TECHNICIANS) => {
  if (!techRef) return 'Workshop Diagnostic Queue';

  if (typeof techRef === 'object' && techRef.name) {
    return techRef.role ? `${techRef.name} (${techRef.role})` : techRef.name;
  }

  const found = customList.find((t) => t._id === techRef || t.name === techRef);
  if (found) {
    return found.role ? `${found.name} (${found.role})` : found.name;
  }

  const fallbackMap = {
    'tech-1': 'Sadun Angelo (Lead Electrical & Information Engineer)',
    'tech-2': 'Kasun Perera (Hardware & Motherboard Specialist)',
    'tech-3': 'Sameera Bandara (IT Support & Firmware Specialist)'
  };

  return fallbackMap[techRef] || techRef;
};

// Helper for generating itemized PDF receipts
// Helper for generating itemized PDF receipts with dynamic vertical positioning
const generateTicketPDF = (ticket) => {
  if (!ticket) return;

  const doc = new jsPDF();
  const SERVICE_CHARGE = 2000;
  const totalCost = Number(ticket.estimatedCost) || 0;
  const partsSubtotal = totalCost > SERVICE_CHARGE ? totalCost - SERVICE_CHARGE : 0;
  
  const techName = resolveTechnicianName(ticket.assignedTechnician);

  // 1. Header Banner
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); 
  doc.text("Computer Repair & Service Management System", 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("123 Tech Avenue, Katuneriya, Sri Lanka | Hotline: +94 77 8868106", 20, 26);

  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.line(20, 30, 190, 30);

  // 2. Reference & Date
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.setFont(undefined, 'bold');
  doc.text(`Tracking Reference: ${ticket.trackingId || 'N/A'}`, 20, 40);
  doc.setFont(undefined, 'normal');
  doc.text(`Date Received: ${ticket.receivedDate || 'N/A'}`, 20, 48);

  // 3. Customer & Device Details
  doc.setFont(undefined, 'bold');
  doc.text("Customer & Device Information", 20, 58);
  doc.setFont(undefined, 'normal');
  doc.text(`Customer Name: ${ticket.customerName || 'N/A'}`, 20, 66);
  doc.text(`Contact Number: ${ticket.phone || 'N/A'}`, 20, 74);
  doc.text(`Address: ${ticket.address || 'N/A'}`, 20, 82);
  doc.text(`Device Model: ${ticket.device || 'N/A'}`, 20, 90);
  doc.text(`Reported Issue: ${ticket.issue || 'N/A'}`, 20, 98);

  // --- DYNAMIC POSITIONING FOR CUSTOMER NOTES ---
  let currentY = 106;
  doc.text("Customer Notes:", 20, currentY);

  const notesText = ticket.comments && ticket.comments.trim() !== '' 
    ? ticket.comments 
    : 'None';

  // Split lines if notes or parts list wrap/span multiple lines
  const splitNotes = doc.splitTextToSize(notesText, 130);
  doc.text(splitNotes, 55, currentY);

  // Calculate new Y coordinate based on how many lines of parts/notes were printed
  currentY += (splitNotes.length * 6) + 6;

  // 4. Dividing Line & Service Overview (Dynamically Adjusted)
  doc.line(20, currentY, 190, currentY);
  currentY += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Service & Diagnostic Overview", 20, currentY);
  currentY += 8;

  doc.setFont(undefined, 'normal');
  doc.text(`Current Status: ${ticket.status || 'Pending Intake'}`, 20, currentY);
  currentY += 8;
  doc.text(`Assigned Technician: ${techName}`, 20, currentY);
  currentY += 8;
  doc.text(`Estimated Completion Date: ${ticket.estimatedTime || 'Pending diagnosis'}`, 20, currentY);
  currentY += 10;

  // 5. Itemized Cost Breakdown
  doc.line(20, currentY, 190, currentY);
  currentY += 10;

  doc.setFont(undefined, 'bold');
  doc.text("Cost Breakdown (LKR)", 20, currentY);
  doc.setFont(undefined, 'normal');

  doc.text(`Parts / Hardware Used:`, 20, currentY + 9);
  doc.text(
    ticket.partsUsed && ticket.partsUsed !== 'None yet' 
      ? `Rs. ${partsSubtotal.toLocaleString('en-US')}` 
      : 'Rs. 0', 
    150, 
    currentY + 9
  );

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${ticket.partsUsed || 'None recorded yet'})`, 20, currentY + 15);

  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text(`Service & Diagnostic Labor Fee:`, 20, currentY + 25);
  doc.text(totalCost > 0 ? `Rs. ${SERVICE_CHARGE.toLocaleString('en-US')}` : 'Rs. 0 (Pending)', 150, currentY + 25);

  currentY += 35;

  // 6. Total Invoice Box
  doc.setFillColor(241, 245, 249);
  doc.rect(20, currentY, 170, 18, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);

  const formattedTotal = totalCost > 0 
    ? `Rs. ${totalCost.toLocaleString('en-US')}` 
    : 'Pending Inspection';

  doc.text("Final Total Amount:", 26, currentY + 12);
  doc.text(formattedTotal, 140, currentY + 12);

  currentY += 28;

  // 7. Footer Disclaimers
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Please present this document when collecting your device from our Katuneriya workshop.", 20, currentY);
  doc.text("Track live updates anytime using your Tracking Reference on our Track Repair portal.", 20, currentY + 6);
  
  const fileName = ticket.trackingId 
    ? `${ticket.trackingId}_Receipt.pdf` 
    : `${ticket.customerName || 'Repair'}_Receipt.pdf`;

  doc.save(fileName);
};

function HomeView() {
  const [homeTickets, setHomeTickets] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/tickets`)
      .then((res) => {
        setHomeTickets(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error("Failed to load tickets on Home:", err));
  }, []);

  // 1. Devices Restored: All fulfilled tickets (both active and collected/archived)
  const completedJobs = homeTickets.filter((t) => t.status === 'Completed').length;

  // 2. Active workbench queues ONLY (deleted/cancelled tickets never clutter active tiles)
  const activeTickets = homeTickets.filter((t) => !t.isDeleted);
  const inProgressJobs = activeTickets.filter((t) => t.status === 'Diagnosing' || t.status === 'Waiting on Parts').length;
  const pendingJobs = activeTickets.filter((t) => t.status === 'Pending').length;

  // 3. Total Jobs Handled: All registered orders received
  const totalJobs = homeTickets.length;

  // 4. Workshop Completion Efficiency:
  // Evaluates completed jobs against active backlog. Fulfilling and clearing jobs increases efficiency.
  const activeBacklog = inProgressJobs + pendingJobs;
  const completionRate = (completedJobs + activeBacklog) > 0 
    ? Math.round((completedJobs / (completedJobs + activeBacklog)) * 100) 
    : 0;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Hero Showcase Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #052644 0%, #0f4c81 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '30px 24px',
          boxShadow: '0 8px 24px rgba(5, 38, 68, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ maxWidth: '480px' }}>
          <span style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            textTransform: 'uppercase', 
            letterSpacing: '1px',
            fontWeight: 'bold' 
          }}>
            Katuneriya's Trusted Tech Lab
          </span>
          <h1 style={{ fontSize: '28px', margin: '12px 0 8px 0', lineHeight: 1.2 }}>
            Precision Device Repair & Chip-Level Solutions
          </h1>
          <p style={{ margin: '0 0 18px 0', color: '#cbd5e1', fontSize: '14px', lineHeight: 1.5 }}>
            From motherboard component diagnostics to high-speed NVMe upgrades and thermal rebuilds. Transparent tracking on every ticket.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/customer" className="btn-success" style={{ textDecoration: 'none', padding: '10px 18px' }}>
              Book a Repair
            </Link>
            <Link to="/track" style={{ 
              textDecoration: 'none', 
              padding: '10px 18px', 
              background: 'rgba(255,255,255,0.12)', 
              color: '#ffffff', 
              borderRadius: '6px', 
              border: '1px solid rgba(255,255,255,0.25)',
              fontWeight: 600
            }}>
              Track Status
            </Link>
          </div>
        </div>

        {/* Hero Visual Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          minWidth: '180px'
        }}>
          <div style={{ fontSize: '38px', fontWeight: '800', color: '#38bdf8' }}>{completionRate}%</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Completion Rate</div>
          <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '6px' }}>● Live Workshop Metrics</div>
        </div>
      </div>

      {/* 2. Live Performance Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div className="ticket-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>✅</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{completedJobs}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Devices Restored</div>
        </div>

        <div className="ticket-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>⚙️</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{inProgressJobs}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Active on Bench</div>
        </div>

        <div className="ticket-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>📥</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{pendingJobs}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Pending Intake</div>
        </div>

        <div className="ticket-card" style={{ margin: 0, padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>📦</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{totalJobs}</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Total Jobs Handled</div>
        </div>
      </div>

      {/* 3. Live Workshop Progress & Breakdown */}
      <div className="ticket-card" style={{ margin: 0, borderLeft: '4px solid var(--accent)' }}>
        <h3 style={{ margin: '0 0 14px 0' }}>📊 Workshop Queue & Job Breakdown</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span><strong>Service Efficiency</strong> ({completedJobs} of {totalJobs || 1} tickets fulfilled)</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{completionRate}%</span>
          </div>
          <div style={{ width: '100%', height: '14px', background: 'var(--bg3)', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${(completedJobs / (totalJobs || 1)) * 100}%`, background: '#22c55e', transition: 'width 0.4s ease' }} title="Completed" />
            <div style={{ width: `${(inProgressJobs / (totalJobs || 1)) * 100}%`, background: '#0284c7', transition: 'width 0.4s ease' }} title="In Progress" />
            <div style={{ width: `${(pendingJobs / (totalJobs || 1)) * 100}%`, background: '#f59e0b', transition: 'width 0.4s ease' }} title="Pending" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span> Completed ({completedJobs})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span> Diagnosing & Parts ({inProgressJobs})
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Pending Queue ({pendingJobs})
          </span>
        </div>
      </div>

      {/* 4. Core Diagnostic Services Grid */}
      <div>
        <h3 style={{ margin: '0 0 12px 0' }}>🛠️ Core Diagnostic Services</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', background: 'var(--card-bg, #ffffff)', borderRadius: '8px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
            <h4 style={{ margin: '0 0 6px 0' }}>Motherboard Chip-Level</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)' }}>Power IC repair, short-circuit recovery, and charging rail diagnostics.</p>
          </div>
          <div style={{ padding: '16px', background: 'var(--card-bg, #ffffff)', borderRadius: '8px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>❄️</div>
            <h4 style={{ margin: '0 0 6px 0' }}>Thermal Architecture</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)' }}>Overheating remediation, high-viscosity paste repasting, and fan rebuilding.</p>
          </div>
          <div style={{ padding: '16px', background: 'var(--card-bg, #ffffff)', borderRadius: '8px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
            <h4 style={{ margin: '0 0 6px 0' }}>NVMe & RAM Expansion</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)' }}>OS migration to high-speed NVMe M.2 SSDs and high-capacity dual-channel RAM.</p>
          </div>
        </div>
      </div>

      {/* 5. Workshop Location & Staff Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        <div className="ticket-card" style={{ margin: 0, borderLeft: '4px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🏢 Workshop Location</h3>
          <p style={{ margin: '4px 0' }}><strong>Address:</strong> 123 Tech Avenue, Katuneriya, Sri Lanka</p>
          <p style={{ margin: '4px 0' }}><strong>Hotline:</strong> +94 77 8868106</p>
          <p style={{ margin: '4px 0' }}><strong>Hours:</strong> Mon – Sat (9:00 AM – 6:00 PM)</p>
        </div>

        <div className="ticket-card" style={{ margin: 0, borderLeft: '4px solid var(--green)' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>👨‍💻 Technical Engineering Team</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text2)', lineHeight: 1.8 }}>
            <li><strong>Sadun Angelo</strong> – Lead Electrical & Information Engineer</li>
            <li><strong>Kasun Perera</strong> – Hardware & Motherboard Specialist</li>
            <li><strong>Sameera Bandara</strong> – IT Support & Firmware Specialist</li>
          </ul>
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
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMessage, setErrorMessage] = useState('');
  const [latestTicket, setLatestTicket] = useState(null);

  const shopCatalog = [
    { name: 'Thermal Paste & Full Deep Cleaning', price: 2500, category: 'Maintenance' },
    { name: '8GB DDR4 RAM Module', price: 7500, category: 'Upgrades' },
    { name: '16GB DDR4 / DDR5 RAM Module', price: 14500, category: 'Upgrades' },
    { name: '512GB NVMe M.2 High-Speed SSD', price: 11000, category: 'Storage' },
    { name: '1TB NVMe M.2 High-Speed SSD', price: 19500, category: 'Storage' },
    { name: '15.6" Full HD Replacement Display', price: 18500, category: 'Display' },
    { name: 'Original Replacement Battery', price: 12000, category: 'Power' },
    { name: 'DC Power Jack / Charging Port Repair', price: 4500, category: 'Motherboard' },
    { name: 'Motherboard Power IC / MOSFET Repair', price: 9500, category: 'Chip-Level' },
    { name: 'Cooling Fan Replacement', price: 5500, category: 'Hardware' }
  ];

  const handleSelectPart = (item) => {
    const formatted = `Interested Part: ${item.name} (~Rs. ${item.price.toLocaleString('en-US')})`;
    if (comments.includes(item.name)) return;
    setComments((prev) => (prev ? `${prev}\n${formatted}` : formatted));
  };

  const submitTicket = async (event) => {
    event.preventDefault(); 
    setErrorMessage('');

    const newTicket = { customerName, address, phone, device, issue, comments, receivedDate };
    
    try {
      const response = await axios.post(`${API_BASE}/tickets`, newTicket);
      setLatestTicket(response.data); 

      setCustomerName(''); 
      setAddress(''); 
      setPhone(''); 
      setDevice(''); 
      setIssue(''); 
      setComments('');
      
      fetchTickets(); 
    } catch (error) {
      const msg = error.response?.data?.error || 'Error submitting ticket. Please check your information.';
      setErrorMessage(msg);
    }
  };

  return (
    <div>
      <div className="ticket-card" style={{ borderLeft: '4px solid var(--accent)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>🏷️ Current In-Stock Parts & Service Pricing</h3>
          <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(56, 189, 248, 0.15)', padding: '3px 8px', borderRadius: '12px' }}>
            Click item to add
          </span>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--text2)' }}>
          Review common replacement parts and benchmark costs. Tap any item to automatically attach it to your intake notes.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: '10px',
          maxHeight: '240px',
          overflowY: 'auto',
          paddingRight: '6px'
        }}>
          {shopCatalog.map((item) => (
            <div 
              key={item.name}
              onClick={() => handleSelectPart(item)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border2)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Click to add to your repair comments"
            >
              <div style={{ paddingRight: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{item.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.category}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#22c55e', whiteSpace: 'nowrap' }}>
                Rs. {item.price.toLocaleString('en-US')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2>Submit your device below for repair.</h2>

      {errorMessage && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--red)', borderRadius: '6px', color: '#fca5a5', marginBottom: '15px', fontSize: '14px' }}>
          ⚠️ <strong>Validation Error:</strong> {errorMessage}
        </div>
      )}
      
      <form onSubmit={submitTicket} className="custom-form" style={{ marginBottom: '15px' }}>
        <input type="text" placeholder="Full Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <input type="text" placeholder="Home Address *" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <input 
          type="tel" 
          placeholder="Telephone Number (e.g., 0778868106) *" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          pattern="^(?:0|94|\+94)?(7[0-9]{8})$" 
          title="Please enter a valid 10-digit Sri Lankan mobile number starting with 07" 
          required 
        />
        <input type="text" placeholder="Device Model (e.g., HP Victus 16, Asus TUF F16) *" value={device} onChange={(e) => setDevice(e.target.value)} required />
        
        <label style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 'bold' }}>
          Received Order Date:
          <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} style={{ marginTop: '5px' }} required />
        </label>

        <textarea placeholder="What is the main problem? *" value={issue} onChange={(e) => setIssue(e.target.value)} rows="3" required />
        <textarea 
          placeholder="Selected catalog parts, passwords, or additional technician instructions will appear here..." 
          value={comments} 
          onChange={(e) => setComments(e.target.value)} 
          rows="3" 
        />
        <button type="submit" className="btn-primary">Submit Request</button>
      </form>

      {latestTicket && (
        <div style={{ padding: '20px', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.3)', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--green)', fontWeight: 'bold', fontSize: '18px' }}>
            ✅ Success! Your device has been submitted.
          </p>
          <p style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#f8fafc' }}>
            Your Tracking ID: <strong style={{ color: '#38bdf8' }}>{latestTicket.trackingId}</strong>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button type="button" onClick={() => generateTicketPDF(latestTicket)} className="btn-success">
              📥 Download PDF Receipt
            </button>
            <Link to="/track" className="btn-primary" style={{ textDecoration: 'none' }}>
              🔍 Track Status
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function TrackView() {
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const trackDevice = async (event) => {
    event.preventDefault();
    if (!searchName.trim()) return;

    try {
      const response = await axios.get(`${API_BASE}/tickets/search/${encodeURIComponent(searchName.trim())}`);
      const visible = (response.data || []).filter((t) => !t.isDeleted || t.status === 'Completed');
      setSearchResults(visible);
      setHasSearched(true);
    } catch (error) {
      alert("Error finding your ticket.");
    }
  };

  return (
    <div>
      <h2>🔍 Track Repair Status</h2>
      <p style={{ color: 'var(--text2)', marginBottom: '18px', fontSize: '14px' }}>
        Enter your assigned Tracking ID (e.g. <code>CR-56535</code>) or your registered Full Name to view real-time workshop progress and invoice estimates.
      </p>

      <form onSubmit={trackDevice} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Enter Tracking ID (e.g., CR-12345) or Customer Name" 
          value={searchName} 
          onChange={(e) => setSearchName(e.target.value)} 
          style={{ flex: 1 }} 
          required 
        />
        <button type="submit" className="btn-success">Search</button>
      </form>

      {hasSearched && searchResults.length === 0 && (
        <div className="ticket-card" style={{ textAlign: 'center', borderColor: 'var(--red)' }}>
          <p style={{ color: 'var(--red)', fontWeight: 'bold', margin: '6px 0' }}>
            No active repair records found for "{searchName}".
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
            Please verify your Tracking Reference ID or contact our Katuneriya lab hotline (+94 77 8868106).
          </p>
        </div>
      )}

      {searchResults.map((ticket) => {
        const techName = resolveTechnicianName(ticket.assignedTechnician);

        return (
          <div key={ticket._id} className="ticket-card" style={{ borderLeft: '4px solid #38bdf8', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{ticket.customerName} — {ticket.device}</h3>
              <span className="status-badge">{ticket.status}</span>
            </div>

            <p style={{ margin: '8px 0 4px 0' }}>
              <strong>Tracking ID:</strong> <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{ticket.trackingId || 'N/A'}</span>
            </p>
            <p style={{ margin: '4px 0' }}><strong>Received Date:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.receivedDate}</span></p>
            <p style={{ margin: '4px 0' }}><strong>Assigned Technician:</strong> {techName}</p>
            <p style={{ margin: '4px 0' }}><strong>Parts / Service:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.partsUsed || 'Under initial diagnostics'}</span></p>
            <p style={{ margin: '4px 0' }}><strong>Estimated Cost:</strong> <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Rs. {ticket.estimatedCost ? Number(ticket.estimatedCost).toLocaleString('en-US') : 0}</span></p>
            <p style={{ margin: '4px 0' }}><strong>Est. Completion Date:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.estimatedTime || 'Pending diagnosis'}</span></p>

            <button 
              type="button" 
              onClick={() => generateTicketPDF(ticket)} 
              className="btn-success" 
              style={{ marginTop: '14px', padding: '8px 14px', fontSize: '13px' }}
            >
              📥 Download / Print Receipt
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AdminLogin({ setIsAuthenticated, fetchTickets }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      if (fetchTickets) fetchTickets(); 
    } else {
      setError('Incorrect password. Access denied.');
    }
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
  const [editTechId, setEditTechId] = useState('');
  const [selectedPartsList, setSelectedPartsList] = useState([]);
  const [editCost, setEditCost] = useState(0);
  const [editTime, setEditTime] = useState('');
  const [activeTab, setActiveTab] = useState('All'); 
  const [sortBy, setSortBy] = useState('newest'); 
  const [technicians, setTechnicians] = useState(DEFAULT_TECHNICIANS);

  const SERVICE_CHARGE = 2000;

  const shopPartsCatalog = [
    { name: 'Thermal Paste & Full Deep Cleaning', price: 2500 },
    { name: '8GB DDR4 RAM Module', price: 7500 },
    { name: '16GB DDR4 / DDR5 RAM Module', price: 14500 },
    { name: '512GB NVMe M.2 High-Speed SSD', price: 11000 },
    { name: '1TB NVMe M.2 High-Speed SSD', price: 19500 },
    { name: '15.6" Full HD Replacement Display', price: 18500 },
    { name: 'Original Replacement Battery', price: 12000 },
    { name: 'DC Power Jack / Charging Port Repair', price: 4500 },
    { name: 'Motherboard Power IC / MOSFET Repair', price: 9500 },
    { name: 'Cooling Fan Replacement', price: 5500 }
  ];

  useEffect(() => {
    fetchTickets();
    axios.get(`${API_BASE}/technicians`)
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTechnicians(res.data);
        }
      })
      .catch((err) => console.warn("Using offline technician fallback list:", err));
  }, [fetchTickets]);

  const getTechDisplayName = (techRef) => {
    return resolveTechnicianName(techRef, technicians);
  };

  // Split Active vs Deleted tickets cleanly
  const activeBenchTickets = ticketList.filter((ticket) => !ticket.isDeleted);
  const deletedTickets = ticketList.filter((ticket) => ticket.isDeleted);

  // Financial pipeline calculated on active bench
  const completedRevenue = activeBenchTickets
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + (Number(t.estimatedCost) || 0), 0);

  const pendingRevenue = activeBenchTickets
    .filter((t) => t.status !== 'Completed')
    .reduce((sum, t) => sum + (Number(t.estimatedCost) || 0), 0);

  const totalPipeline = completedRevenue + pendingRevenue;

  const sendWhatsAppNotification = (ticket) => {
    let cleanPhone = (ticket.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('94')) {
      cleanPhone = '94' + cleanPhone;
    }

    const message = 
      `*Computer Repair & Service Management System*\n\n` +
      `Hello *${ticket.customerName}*,\n\n` +
      `Great news! The repair work on your *${ticket.device}* (Tracking Ref: *${ticket.trackingId}*) has been completed successfully.\n\n` +
      `*Service Summary:*\n` +
      `• Work / Parts Done: ${ticket.partsUsed || 'Standard Service'}\n` +
      `• Total Invoice: Rs. ${(Number(ticket.estimatedCost) || 0).toLocaleString('en-US')}\n` +
      `• Current Status: *Ready for Collection / Pickup*\n\n` +
      `You may now collect your device at our service center. Please bring your tracking reference or receipt upon arrival.\n\n` +
      `*Address:* 123 Tech Avenue, Katuneriya\n` +
      `*Hotline:* +94 77 8868106`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
  };

  const startEditing = (ticket) => {
    setEditingId(ticket._id); 
    setEditStatus(ticket.status || 'Pending');
    
    const currentTech = ticket.assignedTechnician?._id || ticket.assignedTechnician || '';
    setEditTechId(currentTech);

    setEditCost(ticket.estimatedCost || 0);
    setEditTime(ticket.estimatedTime || '');

    if (ticket.partsUsed && ticket.partsUsed !== 'None yet') {
      const partsArray = ticket.partsUsed.split(',').map((p) => p.trim());
      setSelectedPartsList(partsArray);
    } else {
      setSelectedPartsList([]);
    }
  };

  const handleTogglePart = (partName) => {
    let updated;
    if (selectedPartsList.includes(partName)) {
      updated = selectedPartsList.filter((item) => item !== partName);
    } else {
      updated = [...selectedPartsList, partName];
    }
    setSelectedPartsList(updated);

    const partsTotal = updated.reduce((acc, currentName) => {
      const item = shopPartsCatalog.find((p) => p.name === currentName);
      return acc + (item ? item.price : 0);
    }, 0);

    setEditCost(updated.length > 0 ? partsTotal + SERVICE_CHARGE : SERVICE_CHARGE);
  };

  const saveUpdate = async (id) => {
    const formattedPartsString = selectedPartsList.length > 0 ? selectedPartsList.join(', ') : 'None yet';
    
    const updatedData = { 
      status: editStatus, 
      assignedTechnician: editTechId || null, 
      partsUsed: formattedPartsString, 
      estimatedCost: Number(editCost), 
      estimatedTime: editTime 
    };

    try {
      await axios.put(`${API_BASE}/tickets/${id}`, updatedData);
      setEditingId(null); 
      await fetchTickets();     
    } catch (error) {
      alert("Error updating the ticket!");
    }
  };

  // 1. Soft Delete (Moves to Deleted Tab)
  const deleteTicket = async (id, customerName) => {
    if (!window.confirm(`Are you sure you want to delete and archive the ticket for "${customerName}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/tickets/${id}`);
      await fetchTickets();
    } catch (error) {
      const errMsg = error.response?.data?.error || "Error deleting ticket!";
      alert(`Delete Failed: ${errMsg}`);
    }
  };

  // 2. Restore deleted order back to active workbench
  const restoreTicket = async (id, customerName) => {
    if (!window.confirm(`Restore ticket for "${customerName}" back to active workbench?`)) return;
    try {
      await axios.put(`${API_BASE}/tickets/restore/${id}`);
      await fetchTickets();
    } catch (error) {
      const errMsg = error.response?.data?.error || "Error restoring ticket!";
      alert(`Restore Failed: ${errMsg}`);
    }
  };

  // 3. Permanent hard delete (purges from database)
  const permanentlyDeleteTicket = async (id, customerName) => {
    if (!window.confirm(`Warning: This will permanently purge "${customerName}" from MongoDB. Proceed?`)) return;
    try {
      await axios.delete(`${API_BASE}/tickets/permanent/${id}`);
      await fetchTickets();
    } catch (error) {
      alert("Error permanently deleting ticket!");
    }
  };

  // Filtering Logic
  let processedTickets = [];
  if (activeTab === 'Deleted') {
    processedTickets = [...deletedTickets];
  } else if (activeTab === 'All') {
    processedTickets = [...activeBenchTickets];
  } else {
    processedTickets = activeBenchTickets.filter((ticket) => ticket.status === activeTab);
  }

  // Interactive Sorting Logic
  processedTickets.sort((a, b) => {
    if (sortBy === 'newest') return (b.receivedDate || '').localeCompare(a.receivedDate || '');
    if (sortBy === 'oldest') return (a.receivedDate || '').localeCompare(b.receivedDate || '');
    if (sortBy === 'costHigh') return (Number(b.estimatedCost) || 0) - (Number(a.estimatedCost) || 0);
    if (sortBy === 'costLow') return (Number(a.estimatedCost) || 0) - (Number(b.estimatedCost) || 0);
    return 0;
  });

  const filterTabs = [
    { label: 'All Active', value: 'All', count: activeBenchTickets.length },
    { label: 'Pending', value: 'Pending', count: activeBenchTickets.filter((t) => t.status === 'Pending').length },
    { label: 'Diagnosing', value: 'Diagnosing', count: activeBenchTickets.filter((t) => t.status === 'Diagnosing').length },
    { label: 'Waiting on Parts', value: 'Waiting on Parts', count: activeBenchTickets.filter((t) => t.status === 'Waiting on Parts').length },
    { label: 'Completed', value: 'Completed', count: activeBenchTickets.filter((t) => t.status === 'Completed').length },
    { label: '🗑️ Deleted Orders', value: 'Deleted', count: deletedTickets.length, isDanger: true }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>
          {activeTab === 'Deleted' ? '🗑️ Deleted & Archived Orders' : '📋 Active Repair Jobs'} ({processedTickets.length})
        </h2>
        <button onClick={() => setIsAuthenticated(false)} className="btn-dark">Logout</button>
      </div>

      {/* Revenue Analytics Cards (Only for Active Workbench) */}
      {activeTab !== 'Deleted' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#86efac', letterSpacing: '0.5px', fontWeight: 'bold' }}>Earned Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e', marginTop: '4px' }}>Rs. {completedRevenue.toLocaleString('en-US')}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Completed jobs</div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7dd3fc', letterSpacing: '0.5px', fontWeight: 'bold' }}>Pending Revenue</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8', marginTop: '4px' }}>Rs. {pendingRevenue.toLocaleString('en-US')}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>Active on bench / parts</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#cbd5e1', letterSpacing: '0.5px', fontWeight: 'bold' }}>Total Pipeline</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>Rs. {totalPipeline.toLocaleString('en-US')}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>All repairs value</div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Interactive Sorting Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  borderRadius: '20px',
                  background: isActive 
                    ? (tab.isDanger ? '#ef4444' : '#052644') 
                    : '#ffffff',
                  color: isActive ? '#ffffff' : (tab.isDanger ? '#ef4444' : '#334155'),
                  border: tab.isDanger ? '1px solid #ef4444' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  fontWeight: isActive || tab.isDanger ? 'bold' : 'normal'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 'bold' }}>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px', background: 'rgba(3,20,38,0.75)', color: '#ffffff', border: '1px solid var(--border2)' }}
          >
            <option value="newest">📅 Date (Newest First)</option>
            <option value="oldest">📅 Date (Oldest First)</option>
            <option value="costHigh">💰 Cost (High to Low)</option>
            <option value="costLow">💰 Cost (Low to High)</option>
          </select>
        </div>
      </div>
      
      {processedTickets.length === 0 ? (
        <div className="ticket-card" style={{ textAlign: 'center', padding: '30px' }}>
          <p style={{ color: 'var(--text2)', margin: 0 }}>
            {activeTab === 'Deleted' ? 'No deleted orders in archive.' : `No repairs found under "${activeTab}".`}
          </p>
        </div>
      ) : (
        processedTickets.map((ticket) => {
          const techDisplayName = getTechDisplayName(ticket.assignedTechnician);
          const isDeletedCard = ticket.isDeleted;

          return (
            <div 
              key={ticket._id} 
              className="ticket-card"
              style={{
                borderLeft: isDeletedCard ? '4px solid #ef4444' : undefined,
                opacity: isDeletedCard ? 0.9 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0' }}>{ticket.customerName} — {ticket.device}</h3>
                <div>
                  {isDeletedCard && (
                    <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', marginRight: '8px' }}>
                      ARCHIVED / DELETED
                    </span>
                  )}
                  <span className="status-badge">{ticket.status}</span>
                </div>
              </div>

              <p style={{ margin: '8px 0 4px 0' }}><strong>Tracking ID:</strong> <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{ticket.trackingId || 'N/A'}</span></p>
              <p style={{ margin: '4px 0' }}><strong>Received Date:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.receivedDate || 'N/A'}</span></p>
              <p style={{ margin: '4px 0' }}><strong>Address:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.address || 'N/A'}</span></p>
              <p style={{ margin: '4px 0' }}><strong>Problem:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.issue}</span></p>
              <p style={{ margin: '4px 0 15px 0', fontStyle: 'italic', color: 'var(--text3)' }}><strong>Notes:</strong> {ticket.comments || 'None'}</p>
              <hr />

              {editingId === ticket._id ? (
                <div className="custom-form" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px' }}>
                    Current Repair Status:
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)} 
                      style={{ marginTop: '5px', width: '100%', padding: '10px', borderRadius: '6px' }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Diagnosing">Diagnosing</option>
                      <option value="Waiting on Parts">Waiting on Parts</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </label>

                  <label style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px' }}>
                    Assigned Employee / Technician:
                    <select 
                      value={editTechId} 
                      onChange={(e) => setEditTechId(e.target.value)} 
                      style={{ marginTop: '5px', width: '100%', padding: '10px', borderRadius: '6px' }}
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((tech) => (
                        <option key={tech._id || tech.name} value={tech._id || tech.name}>
                          {tech.name} — {tech.role}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px' }}>
                        Shop Parts Used ({selectedPartsList.length} selected):
                      </span>
                      <span style={{ fontSize: '12px', color: '#38bdf8' }}>+ Rs. 2,000 Service Charge</span>
                    </div>
                    
                    <div style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      background: 'rgba(3, 20, 38, 0.75)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {shopPartsCatalog.map((part) => {
                        const isChecked = selectedPartsList.includes(part.name);
                        return (
                          <label 
                            key={part.name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              background: isChecked ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                            }}
                          >
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePart(part.name)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <span style={{ flex: 1, fontSize: '13px', color: isChecked ? '#ffffff' : 'var(--text2)' }}>
                              {part.name}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>
                              Rs. {part.price.toLocaleString('en-US')}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <label style={{ color: 'var(--text2)', fontWeight: 'bold', fontSize: '14px' }}>
                    Estimated Total Cost (LKR / Rupees):
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                      <span style={{ 
                        padding: '10px 14px', 
                        background: 'var(--bg3)', 
                        border: '1px solid var(--border2)', 
                        borderRight: 'none', 
                        borderRadius: '6px 0 0 6px',
                        fontWeight: 'bold',
                        color: 'var(--text)'
                      }}>
                        Rs.
                      </span>
                      <input 
                        type="number" 
                        min="0" 
                        step="50" 
                        value={editCost} 
                        onChange={(e) => setEditCost(e.target.value)} 
                        style={{ borderRadius: '0 6px 6px 0', width: '100%' }}
                      />
                    </div>
                  </label>
                  
                  <label style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 'bold', display: 'block' }}>
                    Estimated Completion Date:
                    <input 
                      type="date" 
                      value={editTime} 
                      onChange={(e) => setEditTime(e.target.value)} 
                      style={{ 
                        marginTop: '5px', 
                        width: '100%', 
                        boxSizing: 'border-box',
                        display: 'block'
                      }} 
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => saveUpdate(ticket._id)} className="btn-success">Save Ticket</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p><strong>Status:</strong> <span className="status-badge">{ticket.status}</span></p>
                  <p><strong>Assigned Tech:</strong> <span style={{ color: 'var(--text2)' }}>{techDisplayName}</span></p>
                  <p><strong>Parts Logged:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.partsUsed}</span></p>
                  <p><strong>Est. Cost:</strong> <span style={{ color: 'var(--text2)' }}>Rs. {ticket.estimatedCost ? Number(ticket.estimatedCost).toLocaleString('en-US') : 0}</span></p>
                  <p><strong>Est. Completion Date:</strong> <span style={{ color: 'var(--text2)' }}>{ticket.estimatedTime || 'Pending diagnosis'}</span></p>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {!isDeletedCard ? (
                      <>
                        <button onClick={() => startEditing(ticket)} className="btn-secondary">Edit Ticket</button>
                        <button onClick={() => deleteTicket(ticket._id, ticket.customerName)} className="btn-danger">Delete</button>
                        
                        {ticket.status === 'Completed' && (
                          <button 
                            type="button" 
                            onClick={() => sendWhatsAppNotification(ticket)} 
                            style={{
                              background: '#25D366',
                              color: '#ffffff',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            💬 WhatsApp Customer
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => restoreTicket(ticket._id, ticket.customerName)} 
                          className="btn-success"
                        >
                          ♻️ Restore to Workbench
                        </button>
                        <button 
                          onClick={() => permanentlyDeleteTicket(ticket._id, ticket.customerName)} 
                          style={{
                            background: '#7f1d1d',
                            color: '#ffffff',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            padding: '8px 14px',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Purge Permanently
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function App() {
  const [ticketList, setTicketList] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  const fetchTickets = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/tickets`);
      setTicketList(response.data); 
    } catch (error) {
      console.log('Error fetching tickets:', error);
    }
  }, []);

  useEffect(() => { 
    fetchTickets(); 
  }, [fetchTickets]);

  return (
    <Router>
      <div className="app-container">
        <h1 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>🛠️ Computer Repair and Service Management System</h1>
        
        <nav className="main-nav">
          <Link to="/" className="nav-link home">Home</Link>
          <Link to="/customer" className="nav-link customer">Book Repair</Link>
          <Link to="/track" className="nav-link track" style={{ background: '#0284c7' }}>🔍 Track Repair</Link>
          <Link to="/admin" className="nav-link admin">Technician Admin</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/customer" element={<CustomerView fetchTickets={fetchTickets} />} />
          <Route path="/track" element={<TrackView />} />
          <Route path="/admin" element={
            isAuthenticated ? (
              <TechnicianView 
                ticketList={ticketList} 
                fetchTickets={fetchTickets} 
                setIsAuthenticated={setIsAuthenticated} 
              />
            ) : (
              <AdminLogin 
                setIsAuthenticated={setIsAuthenticated} 
                fetchTickets={fetchTickets} 
              />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
