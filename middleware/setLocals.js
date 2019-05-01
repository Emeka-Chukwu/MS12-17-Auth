// middleware to set local variables for each rendered view
module.exports = (req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();   // from 'csurf' package
  next();
};
