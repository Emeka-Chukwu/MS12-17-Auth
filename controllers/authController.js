const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// use 'mailtrap.io' (see '.env' file)
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'MS12-17-Auth Login',
    isLoggedIn: req.session.isLoggedIn,
    flashMsg: req.flash()
  });
};

exports.postLogin = (req, res, next) => {
  const {email, password} = req.body;
  let userInDb;
  User
    .findOne({email})
    .then(user => {
      if(!user) return Promise.resolve(false);          // email not found, resolve to false
      userInDb = user;
      return bcrypt.compare(password, user.password);   // compare encrypted passwords
    })
    .then(result => {                                   // 'result' is either 'true' or 'false'
      if(!result) {
        req.flash('error', 'Invalid credentials. Please try again.');
        res.redirect('/login');
      } else {
        req.session.user = userInDb;                    // save logged-in user's session
        req.session.isLoggedIn = true;
        req.session.save(err => {                       // save session before redirecting
          if(err) console.log(err);
          req.flash('success', `Welcome back, ${req.session.user.name}!`);
          res.redirect('/');
        });
      }
    })
    .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if(err) console.log(err);
    res.redirect('/');
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'MS12-17-Auth Signup',
    isLoggedIn: false,
    flashMsg: req.flash()
  });
};

exports.postSignup = (req, res, next) => {
  const {name, email, password, confirmpassword} = req.body;
  if(password !== confirmpassword) {
    req.flash('error', 'Passwords do not match. Please try again.');
    return res.redirect('/signup');
  }
  User
    .findOne({email})
    .then(user => {
      if(user) return Promise.resolve('Email taken'); // pass message to next 'then' block
      return bcrypt.hash(password, 12);               // create hashed password
    })
    .then(result => {
      if(result === 'Email taken') return Promise.resolve(result);  // 'Email taken'
      const newUser = new User({name, email, password: result, cart: {items: []}});
      return newUser.save();                          // returns user object
    })
    .then(result => {
      if(result === 'Email taken') return Promise.resolve(result);  // 'Email taken'
      else if(result.email) {
        const mailOptions = {
          to: email,
          from: process.env.ADMIN_EMAIL,
          subject: 'MS12-17-Auth Signup',
          html: `
            <h1>Hello ${name}, welcome to MS12-17-Auth!</h1>
            <h3>Your signup is complete!</h3>
            <p>Click <a href="http://localhost:3000/login">here</a> to login.</p>
          `
        };
        return transporter.sendMail(mailOptions);     // see sample below
      }
      else return Promise.resolve('Signup failed');   // 'Signup failed'
    })
    .then(result => {
      if(result === 'Email taken') {
        req.flash('error', 'Email in use. Please choose another.');
        res.redirect('/signup');
      } else if(result.accepted.length > 0) {
        req.flash('success', 'Signup successful. Check your email for welcoming message. Please login.');
        res.redirect('/login');
      } else if(result.accepted.length === 0) {
        req.flash('success', 'Signup successful. Please login.');
        res.redirect('/login');
      } else {
        req.flash('error', 'Signup failed. Please try again.');
        res.redirect('/signup');
      }
    })
    .catch(err => console.log(err));
};

// show form to enter email for resetting password
exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: 'reset',
    pageTitle: 'MS12-17-Auth Reset Password',
    flashMsg: req.flash()
  });
};

// if email is valid, create token and send email with link to reset password
exports.postReset = (req, res, next) => {
  const buf = crypto.randomBytes(32);     // synchronous operation
  const token = buf.toString('hex');
  User
    .findOne({email: req.body.email})
    .then(user => {
      if(!user) return Promise.resolve(null);   // no such email
      user.passwordResetToken = token;
      user.passwordResetTokenExpiration = Date.now() + 3600000;   // token expires in 1 hour
      return user.save();                 // save token info to database
    })
    .then(user => {
      if(!user) return Promise.resolve(null);
      else {
        const mailOptions = {
          to: user.email,
          from: process.env.ADMIN_EMAIL,
          subject: 'MS12-17-Auth Reset Password',
          html: `
            <h1>Hello ${user.name},</h1>
            <h3>You requested a password reset.</h3>
            <p>Click <a href="http://localhost:3000/newpwd/${token}">here</a> to set new password.</p>
          `
        };
        return transporter.sendMail(mailOptions);
      }
    })
    .then(result => {
      if(!result) {
        req.flash('error', 'No such email in database. Please try again.');
        res.redirect('/reset');
      } else if(result.accepted.length > 0) {
        req.flash('info', 'Please check your email with link to change password.');
        res.redirect('/login');
      } else if(result.accepted.length === 0) {
        req.flash('error', 'Failed to send email. Please try again.');
        res.redirect('/reset');
      } else {
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/reset');
      }
    })
    .catch(err => console.log(err));
};

// show password reset form only if a valid token is sent from email link
exports.getNewPwd = (req, res, next) => {
  const token = req.params.token;
  User
    .findOne({passwordResetToken: token, passwordResetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
      if(!user) {
        req.flash('error', 'Invalid token. Please try again.');
        res.redirect('/login');
      } else {
        res.render('auth/newpwd', {
          path: 'reset',
          pageTitle: 'MS12-17-Auth Update Password',
          flashMsg: req.flash(),
          user_id: user._id,      // need user's id to pass to 'postNewPwd' route
          token
        });
      }
    })
    .catch(err => console.log(err));
}

// update user password and clear out token fields
exports.postNewPwd = (req, res, next) => {
  const {password, confirmpassword, id, token} = req.body;
  if(password !== confirmpassword) {
    req.flash('error', 'Passwords do not match. Please try again.');
    return res.redirect(`/newpwd/${token}`);
  }
  let user;
  User
    .findOne({_id: id, passwordResetToken: token, passwordResetTokenExpiration: {$gt: Date.now()}})
    .then(usr => {
      user = usr;
      return bcrypt.hash(password, 12);
    })
    .then(hashedPwd => {
      user.password = hashedPwd;
      user.passwordResetToken = null;
      user.passwordResetTokenExpiration = null;
      return user.save();
    })
    .then(user => {
      req.flash('success', 'Password successfully updated.');
      res.redirect('/login');
    })
    .catch(err => console.log(err));
};

// Sample returned object from 'transporter.sendMail()'
// { accepted: ['tiff@example.com'],
//   rejected: [],
//   envelopeTime: 247,
//   messageTime: 205,
//   messageSize: 497,
//   response: '250 2.0.0 Ok: queued',
//   envelope: {from: 'admin@ms12-17-auth.com', to: ['tiff@example.com']},
//   messageId: '<ccae1bda-863c-cef4-63a7-c12ea28c61c5@ms12-17-auth.com>'
// }
