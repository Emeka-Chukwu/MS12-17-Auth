const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// GET /products
exports.getProducts = (req, res, next) => {
  Product
    .find()
    .then(products => {
      res.render('shop/product-list', {
        products,
        pageTitle: 'MS12-17-Auth All Products', 
        path: '/products',
        isLoggedIn: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

// GET /products/:id
exports.getProduct = (req, res, next) => {
  Product
    .findById(req.params.id)
    .then(prod => {
      res.render('shop/product-detail', {
        prod,
        pageTitle: prod.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

// GET /
exports.getIndex = (req, res, next) => {
  Product
    .find()
    .then(products => {
      res.render('shop/index', {
        products, 
        pageTitle: 'MS12-17-Auth Shop', 
        path: '/',
        flashMsg: req.flash()
      });
    })
    .catch(err => console.log(err));
};

// GET /cart (see sample output below)
exports.getCart = (req, res, next) => {
  User
    .findById(req.user._id)
    // get only '_id', 'title', 'price' fields for product (need '_id' to know which to delete)
    .then(user => user
      .populate({path: 'cart.items._pid', select: 'title price'})
      .execPopulate()
    )
    .then(user => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'MS12-17-Auth Cart',
        cartItems: user.cart.items,
        flashMsg: req.flash()
      });
    })
    .catch(err => console.log(err));
};

// POST /add-to-cart
exports.postAddToCart = (req, res, next) => {
  Product
    .findById(req.body.id)
    // use 'req.user' set in 'app.js' because it is a Mongoose object
    // 'req.session.user' does not have access to Mongoose schema
    .then(product => req.user.addToCart(product))
    .then(result => {
      req.flash('success', 'Product added to cart.');
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

// POST /del-cart-item
exports.postDeleteCartItem = (req, res, next) => {
  const {id, qty} = req.body;
  User
    .findById(req.user._id)
    .then(user => user.deleteCartItem(id, qty))
    .then(result => {
      req.flash('success', 'Product removed from cart.');
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

// GET /orders
exports.getOrders = (req, res, next) => {
  Order
    .find({'user._id': req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'MS12-17-Auth Orders',
        orders,
        flashMsg: req.flash()
      });
    })
    .catch(err => console.log(err));
};

// POST /create-order
exports.postOrder = (req, res, next) => {
  User
    .findById(req.user._id)
    .then(user => user
      .populate({path: 'cart.items._pid', select: '-createdAt -updatedAt'})
      .execPopulate()
    )
    .then(user => {
      // use '_doc' to select the data and avoid other mongoose junk
      const products = user.cart.items.map(i => ({qty: i.qty, ...i._pid._doc}));
      const order = new Order({
        user: {_id: req.user._id, name: req.user.name, email: req.user.email},
        items: products
      });
      return order.save();
    })
    // use 'req.user' set in 'app.js' because it is a Mongoose object
    // 'req.session.user' does not have access to Mongoose schema
    .then(result => req.user.clearCart())
    .then(result => {
      req.flash('success', 'Order placed. Thank you.');
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

// Sample output from 'populate'
// {
//   cart: {
//     items: [
//       {
//         _id: 5c0ab1a6147ef9171459e7ca,
//         _pid: { _id: 5c0aaf084ceeea0aec43f4ce, title: 'aaaaaaaaa', price: 11 },
//         qty: 2
//       }
//     ]
//   },
//   admin: true,
//   _id: 5c0aabf1ba11e22cc0bf05e9,
//   name: 'Abbie',
//   email: 'abbie@example.com',
//   password: '123456',
//   image_url: null,
//   createdAt: 2018-12-07T17:20:49.551Z,
//   updatedAt: 2018-12-07T17:45:46.404Z,
//   __v: 1
// }