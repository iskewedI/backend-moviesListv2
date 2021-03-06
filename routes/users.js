const express = require('express');
const router = express.Router();
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { User, validate } = require('../models/user');
const validateBody = require('../middleware/validateBody');
const admin = require('../middleware/admin');
const auth = require('../middleware/auth');

router.get('/', [auth, admin], async (req, res) => {
  const users = await User.find().sort('username');
  res.send(users);
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  res.send(user);
});

router.post('/', validateBody(validate), async ({ body }, res) => {
  const registeredUser = await User.findOne({ email: body.email });
  if (registeredUser) {
    const message =
      body.language === 'en'
        ? 'An user with this data is already registered.'
        : 'Un usuario con estos datos ya ha sido registrado.';
    return res.status(400).send(message);
  }

  //Generating user and hashing password
  const user = new User(_.pick(body, ['username', 'email', 'password']));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = user.generateAuthToken(); //Tokens must not be saved on any database!

  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'username', 'email']));
});

module.exports = router;
