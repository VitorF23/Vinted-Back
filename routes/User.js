const express = require("express");
const router = express.Router();
const User = require("../models/User");
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const fileUpload = require("express-fileupload");
const { uploadToCloudInary } = require("../utils/utils");

// sign up
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const email = req.body.email;
    if (!email || email === "") {
      return res
        .status(404)
        .json({ message: "You need to specify a username and email" });
    }

    const signupUsername = req.body.username;
    if (!signupUsername || signupUsername === "") {
      return res
        .status(400)
        .json({ message: "You need to specify a username and email" });
    }

    const signupEmail = await User.findOne({ email: req.body.email });

    if (signupEmail) {
      return res.status(400).json({ message: "This email is not available" });
    }

    const password = req.body.password;
    const salt = uid2(24);
    const saltedpassword = password + salt;
    const hash = SHA256(saltedpassword).toString(encBase64);
    const token = uid2(16);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    try {
      if (req.files) {
        newUser.account.avatar = await uploadToCloudInary(
          "avatar",
          req.files.avatar,
          newUser._id
        );
        console.log("Create user  with avatar : " + newUser.account.avatar);
      }
    } catch (err) {
      console.error(err);
    }

    const newDbAccount = await newUser.save();

    res.status(200).json({
      _id: newDbAccount._id,
      token: token,
      account: {
        username: req.body.username,
      },
    });
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
});

// Login
router.post("/user/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json("Missing parameters🚨");
    }

    const userFound = await User.findOne({ email: req.body.email });

    if (!userFound) {
      return res
        .status(401)
        .json({ message: "The email or password is not correct" });
    }

    const receivedpassword = req.body.password;
    const saltedReceivedpassword = receivedpassword + userFound.salt;
    const newHash = SHA256(saltedReceivedpassword).toString(encBase64);

    if (newHash === userFound.hash) {
      return res.status(200).json({
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      });
    } else {
      return res.status(401).json({ message: "access denied" });
    }
  } catch (error) {
    res.status(error.status).json({ message: error.message });
  }
});

module.exports = router;
