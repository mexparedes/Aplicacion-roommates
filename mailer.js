const nodemailer = require("nodemailer");

//1. Usar el paquete nodemailer para el envío de correos electrónicos.

function enviar(to, subject, text) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "maildepruebasecamp@gmail.com",
            pass: "Maildepruebas.123",
        },
    });
    let mailOptions = {
        from: "maildepruebasecamp@gmail.com",
        to,
        subject,
        html: text,
    };
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) console.log(err);
        if (data) console.log(data);
    });
} // Paso 2
module.exports = enviar;