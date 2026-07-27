// backend/controllers/contactController.js
const sendEmail = require("../utils/transporter");
const ContactMessage = require("../models/contactModel");

// Send contact form message
exports.sendContactMessage = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields (name, email, subject, message)",
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // Name validation
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 2 characters long",
            });
        }

        // Message validation
        if (message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: "Message must be at least 10 characters long",
            });
        }

        // Phone validation (if provided)
        if (phone && phone.trim() !== "") {
            const phoneRegex = /^(\+2519|09)\d{8}$/;
            if (!phoneRegex.test(phone.replace(/[\s\-]/g, ""))) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must be in Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)",
                });
            }
        }

        // Get client IP and User Agent for tracking
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown';
        const userAgent = req.get('User-Agent') || 'Unknown';

        // Save message to database
        const contactMessage = await ContactMessage.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : undefined,
            subject,
            message: message.trim(),
            ipAddress,
            userAgent,
            status: 'new',
            priority: subject === 'support' ? 'high' : 'medium'
        });

        const contactEmail = process.env.CONTACT_EMAIL || "mengistuanmut45@gmail.com";
        const currentDate = new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Addis_Ababa',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Email content to send to contact email
        const adminEmailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              🔔 New Contact Form Submission
            </h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">
              M4S Broker Platform - Message ID: ${contactMessage._id}
            </p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin-bottom: 20px; font-size: 22px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                📋 Contact Information
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0; width: 30%;">👤 Name:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; color: #2d3748; border: 1px solid #e2e8f0;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0;">📧 Email:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; border: 1px solid #e2e8f0;">
                    <a href="mailto:${email}" style="color: #667eea; text-decoration: none; font-weight: 500;">${email}</a>
                  </td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0;">📞 Phone:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; color: #2d3748; border: 1px solid #e2e8f0;">
                    <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0;">📝 Subject:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; color: #2d3748; border: 1px solid #e2e8f0;">
                    <span style="background-color: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">${contactMessage.subjectDisplay}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0;">🕒 Received:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; color: #2d3748; border: 1px solid #e2e8f0;">${currentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; background-color: #f7fafc; font-weight: 600; color: #4a5568; border: 1px solid #e2e8f0;">🆔 Message ID:</td>
                  <td style="padding: 12px 15px; background-color: #ffffff; color: #2d3748; border: 1px solid #e2e8f0; font-family: monospace;">${contactMessage._id}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 30px;">
              <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 18px;">💬 Message:</h3>
              <div style="padding: 20px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-left: 5px solid #667eea; border-radius: 8px; line-height: 1.6; color: #2d3748;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="color: white; margin: 0; font-size: 14px; opacity: 0.9;">
                🚀 This message was sent from the M4S Broker contact form
              </p>
              <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 12px;">
                Please respond promptly to maintain excellent customer service
              </p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">📊 Admin Actions:</h3>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;">
                • View all messages in admin dashboard: <strong>/admin/contact-messages</strong>
              </p>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;">
                • Message stored in database with ID: <code>${contactMessage._id}</code>
              </p>
              <p style="color: #374151; margin: 5px 0; font-size: 14px;">
                • Status: <strong>New</strong> | Priority: <strong>${contactMessage.priorityDisplay}</strong>
              </p>
            </div>
          </div>
        </div>
        `;

        // Send email to admin
        await sendEmail({
            email: contactEmail,
            subject: `🔔 M4S Broker Contact: ${contactMessage.subjectDisplay}`,
            message: adminEmailContent,
        });

        // Send auto-reply to the user
        const userEmailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              ✅ Thank You for Contacting M4S Broker!
            </h1>
            <p style="color: #c6f6d5; margin: 10px 0 0 0; font-size: 16px;">
              Your message has been received successfully
            </p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin-bottom: 15px; font-size: 22px;">
                Dear ${name},
              </h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Thank you for reaching out to us! We have received your message and our team will get back to you as soon as possible.
              </p>
            </div>

            <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #48bb78;">
              <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Your Message Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568; width: 25%;">Reference ID:</td>
                  <td style="padding: 8px 0; color: #2d3748; font-family: monospace; font-size: 12px;">${contactMessage._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Subject:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${contactMessage.subjectDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568; vertical-align: top;">Message:</td>
                  <td style="padding: 8px 0; color: #4a5568; font-style: italic;">
                    ${message.length > 150 ? message.substring(0, 150) + '...' : message}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Submitted:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${currentDate}</td>
                </tr>
              </table>
            </div>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📞 Our Contact Information:</h3>
              <div style="color: #e2e8f0; line-height: 1.8;">
                <p style="margin: 8px 0;">📧 <strong>Email:</strong> mengistuanmut45@gmail.com</p>
                <p style="margin: 8px 0;">📞 <strong>Phone:</strong> +251 924 328 087</p>
                <p style="margin: 8px 0;">📍 <strong>Office:</strong> Addis Ababa, Ethiopia</p>
                <p style="margin: 8px 0;">🕒 <strong>Hours:</strong> Monday - Friday: 8:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                We typically respond within <strong>24 hours</strong> during business days.
              </p>
              <p style="color: #2d3748; font-size: 16px; font-weight: 600;">
                Best regards,<br>
                <span style="color: #667eea;">M4S Broker Team</span>
              </p>
            </div>

            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #718096; margin: 0; font-size: 12px;">
                This is an automated response. Please do not reply to this email.
              </p>
              <p style="color: #718096; margin: 5px 0 0 0; font-size: 12px;">
                Reference ID: ${contactMessage._id} | If you need immediate assistance, please call us directly at +251 924 328 087
              </p>
            </div>
          </div>
        </div>
        `;

        await sendEmail({
            email: email,
            subject: "✅ Thank you for contacting M4S Broker!",
            message: userEmailContent,
        });

        console.log(`✅ Contact form message sent successfully from ${email} (${name}) - ID: ${contactMessage._id}`);

        res.status(200).json({
            success: true,
            message: "Message sent successfully! We'll get back to you within 24 hours.",
            messageId: contactMessage._id
        });
    } catch (error) {
        console.error("❌ Error sending contact message:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to send message. Please try again later or contact us directly at mengistuanmut45@gmail.com",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

// Get all contact messages (Admin only)
exports.getAllContactMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const subject = req.query.subject;
        const priority = req.query.priority;
        const search = req.query.search;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (subject) filter.subject = subject;
        if (priority) filter.priority = priority;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const messages = await ContactMessage.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('repliedBy', 'fname lname email');

        const total = await ContactMessage.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        // Get statistics
        const stats = await ContactMessage.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusStats = {
            new: 0,
            read: 0,
            replied: 0,
            resolved: 0
        };

        stats.forEach(stat => {
            statusStats[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            messages,
            pagination: {
                currentPage: page,
                totalPages,
                totalMessages: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            stats: statusStats
        });
    } catch (error) {
        console.error("Error fetching contact messages:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contact messages",
            error: error.message
        });
    }
};

// Get single contact message (Admin only)
exports.getContactMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await ContactMessage.findById(id)
            .populate('repliedBy', 'fname lname email');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        // Mark as read if it's new
        if (message.status === 'new') {
            message.status = 'read';
            await message.save();
        }

        res.status(200).json({
            success: true,
            message
        });
    } catch (error) {
        console.error("Error fetching contact message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch contact message",
            error: error.message
        });
    }
};

// Update contact message status (Admin only)
exports.updateContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority, adminNotes } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (priority) updateData.priority = priority;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        if (status === 'replied') {
            updateData.repliedAt = new Date();
            updateData.repliedBy = req.user.id;
        }

        const message = await ContactMessage.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('repliedBy', 'fname lname email');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact message updated successfully",
            data: message
        });
    } catch (error) {
        console.error("Error updating contact message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update contact message",
            error: error.message
        });
    }
};

// Send reply to contact message (Admin only)
exports.replyToContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage, replySubject } = req.body;

        if (!replyMessage || !replySubject) {
            return res.status(400).json({
                success: false,
                message: "Reply subject and message are required"
            });
        }

        // Find the original message
        const originalMessage = await ContactMessage.findById(id);
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        // Update message status
        originalMessage.status = 'replied';
        originalMessage.repliedAt = new Date();
        originalMessage.repliedBy = req.user.id;
        await originalMessage.save();

        const currentDate = new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Addis_Ababa',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Send reply email to user
        const replyEmailContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 0; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              💬 Reply from M4S Broker Team
            </h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">
              Response to your inquiry
            </p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2d3748; margin-bottom: 15px; font-size: 22px;">
                Dear ${originalMessage.name},
              </h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Thank you for contacting M4S Broker. We have reviewed your inquiry and here is our response:
              </p>
            </div>

            <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #667eea;">
              <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📋 Your Original Message:</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568; width: 25%;">Reference ID:</td>
                  <td style="padding: 8px 0; color: #2d3748; font-family: monospace; font-size: 12px;">${originalMessage._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Subject:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${originalMessage.subjectDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #4a5568;">Submitted:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${new Date(originalMessage.createdAt).toLocaleDateString()}</td>
                </tr>
              </table>
              <div style="background: white; padding: 15px; border-radius: 5px; border-left: 3px solid #cbd5e0;">
                <p style="margin: 0; color: #4a5568; font-style: italic; line-height: 1.5;">
                  "${originalMessage.message.length > 200 ? originalMessage.message.substring(0, 200) + '...' : originalMessage.message}"
                </p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💬 Our Response:</h3>
              <div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
                <div style="color: white; line-height: 1.6; font-size: 16px;">
                  ${replyMessage.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                <p style="color: #c6f6d5; margin: 0; font-size: 14px;">
                  <strong>Replied by:</strong> ${req.user.fname} ${req.user.lname} | <strong>Date:</strong> ${currentDate}
                </p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📞 Need Further Assistance?</h3>
              <div style="color: #e2e8f0; line-height: 1.8;">
                <p style="margin: 8px 0;">📧 <strong>Email:</strong> mengistuanmut45@gmail.com</p>
                <p style="margin: 8px 0;">📞 <strong>Phone:</strong> +251 924 328 087</p>
                <p style="margin: 8px 0;">📍 <strong>Office:</strong> Addis Ababa, Ethiopia</p>
                <p style="margin: 8px 0;">🕒 <strong>Hours:</strong> Monday - Friday: 8:00 AM - 6:00 PM</p>
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                If you have any follow-up questions, please don't hesitate to contact us again.
              </p>
              <p style="color: #2d3748; font-size: 16px; font-weight: 600;">
                Best regards,<br>
                <span style="color: #667eea;">M4S Broker Team</span>
              </p>
            </div>

            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="color: #718096; margin: 0; font-size: 12px;">
                This email is a direct response to your inquiry. You can reply to this email for further assistance.
              </p>
              <p style="color: #718096; margin: 5px 0 0 0; font-size: 12px;">
                Reference ID: ${originalMessage._id} | M4S Broker - Multi-Category Brokerage Platform
              </p>
            </div>
          </div>
        </div>
        `;

        await sendEmail({
            email: originalMessage.email,
            subject: `Re: ${replySubject} - M4S Broker Response`,
            message: replyEmailContent,
        });

        // Send notification to admin about successful reply
        const adminEmail = process.env.CONTACT_EMAIL || "mengistuanmut45@gmail.com";
        const adminNotificationContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">✅ Reply Sent Successfully</h2>
          <p><strong>Admin:</strong> ${req.user.fname} ${req.user.lname}</p>
          <p><strong>To:</strong> ${originalMessage.name} (${originalMessage.email})</p>
          <p><strong>Original Message ID:</strong> ${originalMessage._id}</p>
          <p><strong>Reply Subject:</strong> ${replySubject}</p>
          <p><strong>Sent At:</strong> ${currentDate}</p>
          <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
            <h4>Reply Content:</h4>
            <p>${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        `;

        await sendEmail({
            email: adminEmail,
            subject: `✅ Reply Sent - ${originalMessage.name}`,
            message: adminNotificationContent,
        });

        console.log(`✅ Reply sent successfully to ${originalMessage.email} from admin ${req.user.fname} ${req.user.lname}`);

        res.status(200).json({
            success: true,
            message: "Reply sent successfully",
            data: originalMessage
        });
    } catch (error) {
        console.error("Error sending reply:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send reply",
            error: error.message
        });
    }
};

// Delete contact message (Admin only)
exports.deleteContactMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await ContactMessage.findByIdAndDelete(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contact message deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting contact message:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete contact message",
            error: error.message
        });
    }
};