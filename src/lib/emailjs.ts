import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_CONFIG = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key'
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.publicKey);
};

// Send OTP email
export const sendOTPEmail = async (userEmail: string, userName: string, otpCode: string) => {
  try {
    const templateParams = {
      to_email: userEmail,
      to_name: userName,
      otp_code: otpCode,
      expiry_time: '10 minutes',
      company_name: 'Your E-commerce Store'
    };

    console.log('Sending OTP email with params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    console.log('EmailJS response:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error };
  }
};

// Email template example (for EmailJS dashboard setup)
export const getEmailTemplate = () => {
  return `
Dear {{to_name}},

Your verification code for seller dashboard access is:

**{{otp_code}}**

This code will expire in {{expiry_time}}.

If you didn't request this verification, please ignore this email.

Best regards,
{{company_name}} Team

---
This is an automated message, please do not reply.
  `;
};

// Instructions for EmailJS setup
export const getEmailJSSetupInstructions = () => {
  return {
    steps: [
      '1. Go to https://www.emailjs.com and create a free account',
      '2. Add an email service (Gmail, Outlook, etc.)',
      '3. Create an email template with variables: to_email, to_name, otp_code, expiry_time, company_name',
      '4. Get your Service ID, Template ID, and Public Key',
      '5. Add them to your .env.local file:',
      '   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id',
      '   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id', 
      '   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key'
    ],
    templateExample: getEmailTemplate()
  };
};