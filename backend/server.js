const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect'mongodb+srv://lgup-expressvpn:<db_password>@cluster0.3th5y6j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema
const DeviceSchema = new mongoose.Schema({
  macAddress: String,
  phoneNumber: String,
  remainingTime: Number,
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Automatically remove after 24 hours
});

const Device = mongoose.model('Device', DeviceSchema);

// Payment endpoint
app.post('/pay', (req, res) => {
  const { macAddress, time, phoneNumber } = req.body;

  Device.findOneAndUpdate(
    { macAddress },
    { $set: { phoneNumber, remainingTime: time }, $currentDate: { createdAt: true } },
    { new: true, upsert: true }
  )
  .then(() => {
    res.json({ success: true, time });
  })
  .catch(err => res.json({ success: false, error: err.message }));
});

// Remaining time endpoint
app.get('/remaining-time', (req, res) => {
  const { macAddress } = req.query;

  Device.findOne({ macAddress })
    .then(device => {
      if (device) {
        res.json({ success: true, remainingTime: device.remainingTime });
      } else {
        res.json({ success: false, message: 'Device not found' });
      }
    })
    .catch(err => res.json({ success: false, error: err.message }));
});

// Cron job to clear all entries daily
cron.schedule('0 0 * * *', () => {
  Device.deleteMany({})
    .then(() => console.log('All entries cleared from MongoDB'))
    .catch(err => console.error('Error clearing entries:', err));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
