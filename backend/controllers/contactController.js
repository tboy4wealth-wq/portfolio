import Message from "../model/Message.js";
import nodemailer from "nodemailer";

export const sendMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        // Save to MongoDB
        await Message.create({
            name,
            email,
            subject,
            message,
        });

        // Create transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Verify SMTP connection
        await transporter.verify();
        console.log("✅ Gmail SMTP Connected");

        // -----------------------------
        // EMAIL TO YOU
        // -----------------------------
        const adminEmail = await transporter.sendMail({
            from: `"Portfolio Contact" <${process.env.EMAIL}>`,
            to: process.env.EMAIL,
            replyTo: email,
            subject: `📩 New Portfolio Message - ${subject}`,
            html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial;background:#f5f5f5;padding:40px;">
        <div style="max-width:650px;margin:auto;background:#fff;border-radius:10px;padding:30px;">
          <h1 style="color:#d32f2f;">New Portfolio Message</h1>

          <p><strong>Name:</strong> ${name}</p>

          <p>
            <strong>Email:</strong>
            <a href="mailto:${email}">
              ${email}
            </a>
          </p>

          <p><strong>Subject:</strong> ${subject}</p>

          <hr>

          <h3>Message</h3>

          <p style="white-space:pre-wrap;">
            ${message}
          </p>

          <hr>

          <small>
            ${new Date().toLocaleString()}
          </small>

        </div>
      </body>
      </html>
      `,
        });

        console.log("✅ Admin email sent");
        console.log(adminEmail.response);

        // -----------------------------
        // AUTO REPLY
        // -----------------------------
        const autoReply = await transporter.sendMail({
            from: `"Treasure Agbonaye" <${process.env.EMAIL}>`,
            to: email,
            subject: "Thank you for contacting me!",
            html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial;background:#f5f5f5;padding:40px;">

        <div style="max-width:650px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;">

          <div style="background:#d32f2f;color:#fff;padding:30px;text-align:center;">
            <h1>Thank You!</h1>
          </div>

          <div style="padding:35px;">

            <h2>Hello ${name} 👋</h2>

            <p>
              Thank you for reaching out through my portfolio website.
            </p>

            <p>
              I have successfully received your message and will get back to you as soon as possible.
            </p>

            <p>
              Expected response time:
              <strong>24-48 hours</strong>.
            </p>

            <a
              href="http://localhost:5500"
              style="
                display:inline-block;
                margin-top:20px;
                padding:14px 28px;
                background:#d32f2f;
                color:white;
                text-decoration:none;
                border-radius:30px;
              "
            >
              Visit My Portfolio
            </a>

          </div>

          <div style="background:#fafafa;padding:20px;text-align:center;">
            Best Regards,<br>
            <strong>Treasure Agbonaye</strong>
          </div>

        </div>

      </body>
      </html>
      `,
        });

        console.log("✅ Auto reply sent");
        console.log(autoReply.response);

        return res.status(201).json({
            success: true,
            message: "Message sent successfully.",
        });
    } catch (error) {
        console.error("❌ EMAIL ERROR");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};