const poolConfig = {
  connectionLimit: 2,
  host: "localhost",
  user: "root",
  password: "M3x6_rx8rx7",
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
