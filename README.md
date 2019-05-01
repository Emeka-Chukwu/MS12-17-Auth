# MS12-17-Auth

## Section 17 - Advanced Authentication

![a](../assets/a.png?raw=true)
![b](../assets/b.png?raw=true)
![c](../assets/c.png?raw=true)

### 1. Run
- `npm start` listening on port 3000
- Uses `dotenv` package for environment variables in `.env` file
- Uses `ejs` templating engine

### 2. `npm` packages
- `bcryptjs: ^2.4.3`
- `connect-flash: ^0.1.1`
- `connect-mongodb-session: ^2.1.1`
- `csurf: ^1.10.0`
- `dotenv: ^7.0.0`
- `ejs: ^2.6.1`
- `express: ^4.16.4`
- `express-session: ^1.16.1`
- `helmet: ^3.16.0`
- `mongoose: ^5.5.5`
- `nodemailer: ^6.1.1`

### 3. Database
- Database: `udemy` on MongoDB Atlas
- Collections: `ms1214prods`, `ms1214users`, `ms1214orders`, `ms12sessions`
  - Stores cart info as embedded document in `ms1214users`

### 4. Section 14 changes
- Uses `express-session` package to store session id in default cookie `connect.sid`
- Uses `connect-mongodb-session` package to store session data in database
- Stores user info and `isLoggedIn` flag in `req.session` object
- Stores `mongoose` user instance in `req.user` to get access to instance methods
- Data for `req.user` obtained from `req.session.user`

### 5. Sections 15 and 16 changes
- Adds `signup` link, page, and routes
- Removes creating default user on startup
- Encrypts password with `bcryptjs` package
- Protects routes by checking `req.session.isLoggedIn` in `middleware/isAuth` middleware
- Sets `req.user` from `req.session.user` in middleware file
- `middleware/setLocals.js` middleware
  - sets local variable `isLoggedIn` for views
  - sets local variable `csrfToken` for views with `input` fields named `_csrf` (`csurf` package)
- Flashes messages with `connect-flash` package
- Sends email with `nodemailer` package through `mailtrap.io`

### 6. Section 17 changes
- Adds password reset link, page, and routes
- Uses `crypto` package to create token for password reset email through `mailtrap.io`
- Adds form to change password
- Adds authorization to admin (edit and delete) user's own products only
