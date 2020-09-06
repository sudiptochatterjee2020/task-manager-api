const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// welcome email is send out when an user registers on the app
const sendWelcomeEmail = (email, name) => {
    const welcomeMsg = {
        to: email,
        from: 'sudiptochatterjee@gmail.com',
        subject: `Welcome ${name} to the task manager application!`,
        text: `Thank you ${name} for choosing the task manager application. Let me know how you get along with the app.`
    }

    sgMail.send(welcomeMsg)
}

// Cancellation email is send out when an user deletes his profile on the app
const sendCancellationEmail = (email, name) => {
    const cancellationMsg = {
        to: email,
        from: process.env.ADMIN_MAIL_ID,
        subject: `Goodbye ${name}!`,
        text: `Goodbye ${name}! I am sorry to see you go. Let me know your experience with the app and what could have been better.`
    }

    sgMail.send(cancellationMsg)
}

module.exports = {sendWelcomeEmail, sendCancellationEmail};