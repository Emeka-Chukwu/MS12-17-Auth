require('dotenv').config()
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const setUser = require('./middleware/setUser');
const setLocals = require('./middleware/setLocals');

// express
const app = express();
app.use(helmet());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// sessions and CSRF
const csrfProtection = csrf();
const store = new MongoDBStore({
  uri: process.env.MONGOURI,
  collection: 'ms12sessions'
});
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store
}));
app.use(csrfProtection);  // must come after sessions
app.use(flash());
app.use(setUser);         // set 'req.user' to logged-in user
app.use(setLocals);       // set variables 'isLoggedIn' and 'csrfToken' for views

// routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shopRoutes = require('./routes/shopRoutes');
app.use(authRoutes);
app.use('/admin', adminRoutes);
app.use(shopRoutes);

// templating engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// 404 error
const errController = require('./controllers/errorsController');
app.use(errController.get404);

const port = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGOURI, {useNewUrlParser: true, poolSize: 5})
  .then(result => {
    app.listen(port, () => console.log(`MS12-17-Auth on port ${port}...`));
  })
  .catch(err => console.log(err));
