const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const mongoURI = 'mongodb+srv://lgup-expressvpn:Anntwan14@cluster0.3th5y6j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Updated to MongoDB Atlas connection string
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Verification schema and model
const verificationSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // expires after 5 minutes
});

const Verification = mongoose.model('Verification', verificationSchema);

// Middleware
app.use(bodyParser.json());

// Phone number validation function
function isValidPhoneNumber(phoneNumber) {
  // Accept +63 or 09 followed by 9 digits
  const regex = /^(\+63|09)\d{9}$/;
  return regex.test(phoneNumber);
}

// Generate 6-digit numeric token
function generateToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// /verify POST endpoint
app.post('/verify', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({ status: 'error', message: 'Invalid phone number.' });
  }

  const token = generateToken();

  try {
    // Upsert verification record
    await Verification.findOneAndUpdate(
      { phoneNumber },
      { token, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send SMS via Termux API
    const smsCommand = `termux-sms-send -n ${phoneNumber} "Your verification code is: ${token}"`;
    exec(smsCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error sending SMS:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to send SMS.' });
      }
      console.log('SMS sent:', stdout);
      return res.json({ status: 'pending', message: 'Verification code sent.' });
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
