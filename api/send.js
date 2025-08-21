import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Read HTML templates
    const ownerTemplatePath = path.join(__dirname, '..', 'templates', 'emailToOwner.html');
    const senderTemplatePath = path.join(__dirname, '..', 'templates', 'emailToSender.html');
    let ownerTemplate = await fs.readFile(ownerTemplatePath, 'utf-8');
    let senderTemplate = await fs.readFile(senderTemplatePath, 'utf-8');

    // Replace placeholders
    const replacements = {
      '{{name}}': name,
      '{{email}}': email,
      '{{phone}}': phone || 'N/A',
      '{{subject}}': subject || 'N/A',
      '{{message}}': message.replace(/\n/g, '<br>'), // Convert newlines to <br> for HTML
    };

    ownerTemplate = ownerTemplate.replace(/{{name}}|{{email}}|{{phone}}|{{subject}}|{{message}}/g, (match) => replacements[match]);
    senderTemplate = senderTemplate.replace(/{{name}}|{{email}}|{{phone}}|{{subject}}|{{message}}/g, (match) => replacements[match]);

    // Email to owner (you)
    let mailOptionsToOwner = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: subject || "New Contact Form Message",
      html: ownerTemplate,
    };

    // Auto-reply email to sender
    let mailOptionsToSender = {
      from: `"Sifat's Portfolio" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank You for Contacting Me!",
      html: senderTemplate,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(mailOptionsToOwner),
      transporter.sendMail(mailOptionsToSender),
    ]);

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