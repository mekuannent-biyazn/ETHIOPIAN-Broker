const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');

// Ensure environment variables are set
if (!process.env.SMTP_EMAIL_USER || !process.env.SMTP_EMAIL_PASS) {
    console.error('❌ EMAIL SERVICE ERROR: SMTP_EMAIL_USER and SMTP_EMAIL_PASS environment variables must be set.');
    throw new Error('SMTP credentials missing. Set SMTP_EMAIL_USER and SMTP_EMAIL_PASS in your environment.');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL_USER,
        pass: process.env.SMTP_EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: true // Enforce secure TLS
    }
});


// Verify the connection configuration (only in development, never log secrets)
if (process.env.NODE_ENV !== 'production') {
    transporter.verify(function(error, success) {
        if (error) {
            // Only log generic error in development
            // Do not log credentials or sensitive data
            // You may replace this with a proper logger if needed
            // eslint-disable-next-line no-console
            console.error('❌ EMAIL SERVICE ERROR: Cannot connect to SMTP server.');
        } else {
            // eslint-disable-next-line no-console
            console.log('✅ Gmail SMTP is ready to send emails!');
        }
    });
}

const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `ETHIO-BROKER-M4S <${process.env.SMTP_EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.message,
        };
        // Never log email addresses or sensitive info in production
        let info = await transporter.sendMail(mailOptions);
        return info;
    } catch (err) {
        // Only log generic error in development
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('❌ Failed to send email.');
        }
        throw new Error('Email sending failed.');
    }
};

module.exports = sendEmail;