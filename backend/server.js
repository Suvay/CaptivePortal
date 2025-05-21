
const twilio = require('twilio');
const accountSid = 'AC4be3d74a1331d5450fe9e251826aa986';
const authToken = '893e236d749765fc4d85ae5befc12863';
const client = twilio(accountSid, authToken);

// /verify POST endpoint with Twilio Verify API for RCS
app.post('/verify', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({ status: 'error', message: 'Invalid phone number.' });
  }

  try {
    // Start verification via Twilio Verify service
    const verification = await client.verify.v2.services("VAff84280316c23c0af74ba76427495704")
      .verifications
      .create({ to: phoneNumber, channel: 'sms' }); // Change 'sms' to 'rcs' if supported

    // Upsert verification record with token placeholder (Twilio handles token)
    await Verification.findOneAndUpdate(
      { phoneNumber },
      { token: 'pending', createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ status: 'pending', message: 'Verification code sent via Twilio.' });
  } catch (error) {
    console.error('Twilio Verify error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send verification code via Twilio.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
