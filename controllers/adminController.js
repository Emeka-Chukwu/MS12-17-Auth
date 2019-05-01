const {ObjectId} = require('mongodb');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /admin/add-product
exports.getAddProduct = (req, res, next) => {
  // if(!req.session.isLoggedIn) return res.redirect('/login');  // one way of route protection but not scaleable
  res.render('admin/edit-product', {
    pageTitle: 'MS12-17-Auth Add Product', 
    path: '/admin/add-product',
    editing: false
  });
};

// POST /admin/add-product
exports.postAddProduct = (req, res, next) => {
  const {title, price, description, image_url} = req.body;
  const product = new Product({title, price, description, image_url, user_id: req.user._id});
  product
    .save()
    .then(result => res.redirect('/admin/products'))
    .catch(err => console.log(err));
};

// GET /admin/edit-product
exports.getEditProduct = (req, res, next) => {
  const editMode = !!req.query.edit;
  Product
    .findById(req.params.id)
    .then(prod => {
      res.render('admin/edit-product', {
        pageTitle: 'MS12-17-Auth Edit Product', 
        path: '/admin/edit-product',
        editing: editMode,
        prod
      });
    })
    .catch(err => console.log(err));
};

// POST /admin/edit-product
exports.postEditProduct = (req, res, next) => {
  const {id, title, price, description, image_url} = req.body;
  Product
    .findById(id)
    .then(product => {
      // user can only update owned products
      if(product.user_id.toString() !== req.user._id.toString()) return Promise.resolve(null);
      return product.update({$set: {title, price, description, image_url}});
    })
    .then(result => {
      if(!result) req.flash('error', 'You can only update your own products.');
      else req.flash('success', 'Product successfully updated.');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};

// GET /admin/products
exports.getProducts = (req, res, next) => {
  Product
    .find({user_id: req.user._id})    // show only products created by user
    .then(products => {
      res.render('admin/admin-products', {
        products, 
        pageTitle: 'MS12-17-Auth All Products', 
        path: '/admin/products',
        flashMsg: req.flash()
      });
    })
    .catch(err => console.log(err));
};

// POST /admin/delete-product
exports.postDeleteProduct = (req, res, next) => {
  Product
    .findById(req.body.id)
    .then(product => {
      // user can only delete owned products
      if(product.user_id.toString() !== req.user._id.toString()) return Promise.resolve(null);
      return product.remove();
    })
    .then(result => {
      if(!result) return Promise.resolve(null);
      // delete product from all users' carts
      return User.updateMany({}, {$pull: {'cart.items': {_pid: ObjectId(req.body.id)}}});
    })
    .then(result => {
      if(!result) req.flash('error', 'You can only delete your own products.');
      else req.flash('success', 'Product successfully deleted.');
      res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};
