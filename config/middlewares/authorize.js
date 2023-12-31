require("dotenv").config();
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");
const User = require("../tables/user/User");
const Retailer = require("../tables/store/Retailer");
const Admin = require("../tables/admin/Admin");
const DSR = require("../tables/store/DSR");

const authorizeMw = (req, res, next) => {
  const bearerHeader = req.header("Authorization");
  if (!bearerHeader) {
    return res.status(401).json({ error: "Unauthorized Request" });
  }
  const splitValue = bearerHeader.split(" ");

  if (splitValue.length !== 2 && splitValue[0] !== "Bearer") {
    return res.status(401).json({ error: "Unauthorized Request" });
  }
  const token = splitValue[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(400)
        .json({ error: "Token expired, please login again" });
    const { id } = decoded;
    const foundUser = await User.findOne({ where: { id, verified: true } });
    if (foundUser) {
      req.currentUser = {
        type: "user",
        data: foundUser.dataValues,
      };
      next();
    }
  });
};

const authorizeMwRetailer = (req, res, next) => {
  const bearerHeader = req.header("Authorization");
  if (!bearerHeader) {
    return res.status(401).json({ error: "Unauthorized Request" });
  }
  const splitValue = bearerHeader.split(" ");

  if (splitValue.length !== 2 && splitValue[0] !== "Bearer") {
    return res.status(401).json({ error: "Unauthorized Request" });
  }

  const token = splitValue[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(400)
        .json({ error: "Token expired, please login again" });

    const { id } = decoded;
    const foundStore = await Retailer.findOne({ where: { id, active: true } });
    if (foundStore) {
      req.currentRetailer = {
        type: "retailer",
        data: foundStore.dataValues,
      };
      next();
    } else {
      return res.status(400).json({ error: "Token : Store not found" });
  }
  });
};


const authorizeMwDSR = (req, res, next) => {
  const bearerHeader = req.header("Authorization");
  if (!bearerHeader) {
    return res.status(401).json({ error: "Unauthorized Request" });
  }
  const splitValue = bearerHeader.split(" ");

  if (splitValue.length !== 2 && splitValue[0] !== "Bearer") {
    return res.status(401).json({ error: "Unauthorized Request" });
  }

  const token = splitValue[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(400)
        .json({ error: "Token expired, please login again" });

    const { id } = decoded;
    const foundDSR = await DSR.findOne({ where: { id, active: true } });
    if (foundDSR) {
      req.currentDsr = {
        type: "dsr",
        data: foundDSR.dataValues,
      };
      next();
    } else {
      return res.status(400).json({ error: "Token : DSR not found" });
    }
  });
};

const authorizeMwAdmin = (req, res, next) => {
  const bearerHeader = req.header('Authorization');

  if (!bearerHeader) {
    return res.status(401).json({ error: "Unauthorized Request" });
  }
  const splitValue = bearerHeader.split(" ");

  if (splitValue.length !== 2 && splitValue[0] !== "Bearer") {
    return res.status(401).json({ error: "Unauthorized Request" });
  }

  const token = splitValue[1];

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err)
      return res
        .status(400)
        .json({ error: "Token expired, please login again" });

    const { id } = decoded;
    const foundAdmin = await Admin.findOne({ where: { id } });
    if (foundAdmin) {
      req.admin === foundAdmin.dataValues,
      next();
    } else {
      return res.status(400).json({ error: "Token : Admin not found" });
    }
  });
};

module.exports = { authorizeMw, authorizeMwRetailer, authorizeMwAdmin,authorizeMwDSR };
