const nodemailer = require('nodemailer');

class SMTPMailer {
  constructor({host="localhost", port=25, secure=false, authType='login', user='', pass=''}) {
    let options = {
      host,
      port,
      secure,
      auth: {
        type: authType,
        user,
        pass
      }
    };
    this.transporter = nodemailer.createTransport(options);
  }

  async sendMail({from, to, cc, bcc, subject, html}) {
    await this.transporter.sendMail({
      from, to, cc, bcc, subject, html
    });
  }
}

class GMailMailer {

  constructor({ user, pass }) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }

  async sendMail({from, to, cc, bcc, subject, html}) {
    await this.transporter.sendMail({
      from, to, cc, bcc, subject, html
    });
  }

}

module.exports = {
  SMTPMailer,
  GMailMailer
};
