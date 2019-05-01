// middleware to set 'req.user' to logged-in user
const User = require('../models/User');

module.exports = (req, res, next) => {
  if(req.session.user) User
    .findOne(req.session.user._id)
    .then(user => {
      req.user = user;  // mongoose model with access to instance methods
      next();
    })
    .catch(err => console.log(err));
  else next();
};
