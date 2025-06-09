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

