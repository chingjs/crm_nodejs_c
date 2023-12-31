require("dotenv").config();
const express = require("express");
const Sequence = require("../../config/tables/misc/Sequence");
const Admin = require("../../config/tables/admin/Admin");
const router = express.Router();
const fs = require("fs");
const { parse } = require("csv-parse");
const bcrypt = require("bcryptjs");
const Voucher = require("../../config/tables/settings/voucher/Voucher");

router.post("/createMisc", async (req, res) => {
  try {
    const checkSetting = await Sequence.findOne({
      where: { type: "psTracking" },
    });

    if (!checkSetting) {
      Sequence.bulkCreate([
        { type: "psTracking", currentSequence: 1 },
      ]);
    }

    return res.status(200).json({ message: "success" });
  } catch (err) {
    console.error("Error when finding user in signin");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});


router.post("/admin/create", async (req, res) => {
  const { username, password } = req.body;
  const salt = bcrypt.genSaltSync(13);
  const hash = bcrypt.hashSync(password, salt);
  if (!username || !password)
    return res
      .status(400)
      .json({ error: "Please ensure your have all the informations fill up!" });

  const user = await Admin.findOne({ where: { username } });

  if (user) {
    return res.status(400).json({ error: "Username Existed." });
  }
  try {
    const newUser = new Admin({
      username,
      password: hash,
      role: "ADMIN",
    });
    const newUserSave = await newUser.save();
    if (!newUserSave) {
      return res.status(400).json({ error: "fail to save new admin" });
    }

    return res.status(200).json({
      message: "create success",
    });
  } catch (error) {
    console.error("Error caught in create api");
    console.error(error);
    return res.status(400).json({ error: "Internal Error" });
  }
});

router.post("/sku/create", async (req, res) => {
  let csvData = [];
  fs.createReadStream("./routes/api/SKU_SG.csv")
    .pipe(parse({ delimiter: ",", from_line: 1 }))
    .on("data", async function (row) {
      const newBrand = new Sku({
        brand: row[0],
        name: row[1],
        weight: row[2],
        desc: row[3],
        minQty: row[4],
      });
    })
    .on("end", async function () {
      console.log("finished");
    })
    .on("error", function (error) {
      console.log(error.message);
    });

  try {
    return res.status(200).json({ message: "created", csvData });
  } catch (error) {
    console.error("Error caught in create api");
    console.error(error);
    return res.status(400).json({ error: "Internal Error" });
  }
});

module.exports = router;
