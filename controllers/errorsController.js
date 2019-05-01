exports.get404 = (req, res, next) => {
  res
    .status(404)
    .render('404', {
      pageTitle: 'MS12-17-Auth Error',
      path: '',
      isLoggedIn: req.session.isLoggedIn
    });
};
