// utils/sendEmail.js
import nodemailer from "nodemailer"

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "email.send.services@gmail.com",
      pass: process.env.EMAIL_PASSWORD, // use environment variable for security
    },
  });

  const mailOptions = {
    from: "email.send.services@gmail.com",
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export const makeEmailBody = (name , email , password)=>{ 
  let body = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <h2 style="color: #007bff; margin-top: 0;">Welcome to Our Platform, ${name}!</h2>
      <p>We're excited to have you on board. Your account has been successfully created. Please find your login credentials below:</p>
      
      <div style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Username:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>

      <p style="margin-bottom: 20px;">You can now log in to your account using the above credentials. For security reasons, we strongly recommend that you change your password after logging in.</p>
      
      <a href="https://your-app-domain.com/login" target="_blank" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Login Now</a>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

      <p style="font-size: 14px; color: #888;">If you did not request this account, please contact our support team immediately.</p>
      <p style="font-size: 14px; color: #888;">– Team Water Management</p>
    </div>
  </div>
`;

return body;
}

