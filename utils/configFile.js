const poolConfig = {
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "1234",
  port: 3306,
  database: "usersdb",
};

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "trmailforupfile@gmail.com",
    pass: "xbhu rhhb eysz emtc",
  },
});

module.exports = {
  poolConfig,
  transporter,
};
