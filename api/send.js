import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors({
  origin: ["https://tanvir-sifat.vercel.app", "http://localhost:5173"],
  methods: ["POST", "HEAD"],
}));
app.use(express.json());

app.post('/api/send', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Name, email, and message are required." });
  }

  try {
    // Create transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter configuration
    await transporter.verify();

    // Email options
    let mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: subject || "New Contact Form Message",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", {
      message: error.message,
      stack: error.stack,
      emailUser: process.env.EMAIL_USER ? "Set" : "Not set",
    });
    return res.status(500).json({ success: false, message: `Error sending message: ${error.message}` });
  }
});

// Export the Express app as a serverless function
export default app;