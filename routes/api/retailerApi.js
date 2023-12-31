require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const AWS = require("aws-sdk");
const { genStatementID, generateCode } = require("../../config/functions/misc");
const {
  authorizeMwRetailer,
  authorizeMwDSR,
} = require("../../config/middlewares/authorize");
const { s3Upload } = require("../../config/functions/aws");
const { generateOtp, sendSMS } = require("../../config/functions/sms");
const {
  registrationMessage,
} = require("../../config/functions/dynamicController");
const User = require("../../config/tables/user/User");
const Otp = require("../../config/tables/user/Otp");
const Transaction = require("../../config/tables/transaction/Transaction");
const Retailer = require("../../config/tables/store/Retailer");
const Dsr = require("../../config/tables/store/DSR");
const TagReceipt = require("../../config/tables/transaction/TagReceipt");
const { Sequelize } = require("../../config/sequelize");
const { startOfMonth, endOfMonth } = require("date-fns");
const Claim = require("../../config/tables/store/Claim");
const {
  getOtp5minsExpirationDate,
  checkIsExpiredDateByDateString,
} = require("../../config/functions/helperFunctions");

const RECURIT_ENTITLEMENT_PER_USER = 5;
const CURRENCY = "RM";

// CHECK RETAILER/SALESREP PHONE NO.
// POST @-> /api/retailer/checkRetailer
router.post("/checkRetailer", async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "Number not found" });
  }

  try {
    const findRetailer = await Retailer.findOne({ where: { number } });
    const findDsr = await Dsr.findOne({ where: { number } });
    const findOtp = await Otp.findOne({ where: { number } });

    if (!findRetailer && !findDsr) {
      return res.status(400).json({ error: "Phone no is not valid." });
    }

    if ((!findOtp && findRetailer) || (!findOtp && findDsr)) {
      return generateOtp(async (otp) => {
        const expiredAt = getOtp5minsExpirationDate();

        const newOTP = Otp.build({
          number,
          otp,
          expiredAt,
        });
        const message = registrationMessage(otp, "en");
        if (!message) {
          return res.status(400).json({
            error: "failed to get message",
          });
        }
        const saveOtp = await newOTP.save();
        if (saveOtp) {
          sendSMS(saveOtp.number, message);
          return res.status(200).json({
            message: "success",
            number,
          });
        } else {
          console.log("OTP failed to send");
          return res.status(400).json({
            error: "failed to send otp.",
          });
        }
      });
    } else {
      return generateOtp(async (otp) => {
        findOtp.otp = otp;
        findOtp.expiredAt = getOtp5minsExpirationDate();
        await findOtp.save();
        const message = registrationMessage(otp, "en");
        if (!message) {
          return res.status(400).json({
            error: "failed to get message",
          });
        }
        sendSMS(number, message);
        return res.status(200).json({ message: "success" });
      });
    }
  } catch (error) {
    console.error("Error caught in checkUser api");
    console.error(error);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// CHECK RETAILER/SALESREP OTP VERIFICATION
// POST @-> /api/retailer/verifyOtp
router.post("/verify-otp", async (req, res) => {
  const { number, otp } = req.body;

  if (!number || !otp) {
    return res.status(400).json({ error: "Phone No or OTP is missing." });
  }

  try {
    const foundOtp = await Otp.findOne({ where: { number } });

    if (!foundOtp) {
      generateOtp(async (otp) => {
        const expiredAt = getOtp5minsExpirationDate();

        const newOTP = Otp.build({
          number,
          otp,
          expiredAt,
        });
        const message = registrationMessage(otp);
        if (!message) {
          return res.status(400).json({
            error: "failed to get message",
          });
        }
        const saveOtp = await newOTP.save();
        if (saveOtp) {
          sendSMS(saveOtp.number, message);
          return res.status(400).json({
            error:
              "You OTP has already expired, we have sent you another OTP. Please try to verify again",
          });
        } else {
          return res.status(400).json({
            error: "failed to send otp.",
          });
        }
      });
    } else {
      if (foundOtp.otp !== otp) {
        return res
          .status(400)
          .json({ error: "OTP incorrect, please try again" });
      } else if (foundOtp.otp === otp) {
        if (checkIsExpiredDateByDateString(foundOtp.expiredAt)) {
          return res.status(400).json({
            error: "You OTP has expired, please request again.",
          });
        }

        const getRetailer = await Retailer.findOne({
          where: { number, active: true },
        });
        const getDsr = await Dsr.findOne({
          where: { number, active: true },
        });
        if (getRetailer) {
          jwt.sign(
            { id: getRetailer.id },
            process.env.JWT_SECRET,
            { expiresIn: "12h" },
            (err, token) => {
              if (err) {
                console.error(
                  "Error when signing a jwt token in getRetailerInfo : \n",
                  err
                );
              }
              const data = {
                token,
                message: "success",
                type: "retailer",
              };
              return res.status(200).json(data);
            }
          );
        } else if (getDsr) {
          jwt.sign(
            { id: getDsr.id },
            process.env.JWT_SECRET,
            { expiresIn: "12h" },
            (err, token) => {
              if (err) {
                console.error(
                  "Error when signing a jwt token in getDsrInfo : \n",
                  err
                );
              }
              const data = {
                token,
                message: "success",
                type: "dsr",
              };
              return res.status(200).json(data);
            }
          );
        } else {
          return res
            .status(400)
            .json({ error: "Error getting operator token" });
        }
      }
    }
  } catch (error) {
    console.error("Error caught in verify api");
    console.error(error);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// CHECK RETAILER SESSION-TOKEN
// POST @-> /api/retailer/session
router.post("/retailer/session", authorizeMwRetailer, async (req, res) => {
  const foundRetailer = req.currentRetailer.data;
  const foundRetailerType = req.currentRetailer.type;

  if (!foundRetailer) {
    return res.status(400).json({ error: "User not found" });
  }

  let selectedRetailer = foundRetailer;
  const { storeId, dateRange } = req.body;

  if (storeId) {
    const findSelectedRetailer = await Retailer.findOne({
      where: { id: storeId, active: true },
    });
    if (!findSelectedRetailer) {
      return res.status(400).json({ error: "Store not found" });
    }

    selectedRetailer = findSelectedRetailer;
  }
  let registeredUserByRetailerQuery = {
    retailerId: selectedRetailer.id,
  };

  if (dateRange && dateRange.startDate && dateRange.endDate) {
    registeredUserByRetailerQuery = {
      ...registeredUserByRetailerQuery,
      createdAt: {
        [Sequelize.Op.between]: [dateRange.startDate, dateRange.endDate],
      },
    };
  } else {
    // default query users base on current month date range
    const currentDate = new Date();
    const startDateOfMonth = startOfMonth(currentDate).toISOString();
    const endDateOfMonth = endOfMonth(currentDate).toISOString();

    registeredUserByRetailerQuery = {
      ...registeredUserByRetailerQuery,
      createdAt: {
        [Sequelize.Op.between]: [startDateOfMonth, endDateOfMonth],
      },
    };
  }

  let currDate = new Date();
  let startDate = startOfMonth(currDate).toISOString();
  let endDate = endOfMonth(currDate).toISOString();

  const registeredUserByRetailer = await User.findAll({
    where: registeredUserByRetailerQuery,
    include: [
      {
        model: Transaction,
        where: {
          status: {
            [Op.not]: null,
          },
        },
      },
    ],
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // Adding 1 to get 1-based month
  const currentDate = new Date().getDate();

  let dateRangeStart, dateRangeEnd;

  if (currentMonth === 1) {
    dateRangeStart = new Date(currentYear - 1, 9, 1);
    dateRangeEnd = new Date(currentYear - 1, 11, 31);
  } else if (currentMonth === 4) {
    dateRangeStart = new Date(currentYear, 0, 1);
    dateRangeEnd = new Date(currentYear, 2, 31);
  } else if (currentMonth === 7) {
    dateRangeStart = new Date(currentYear, 3, 1);
    dateRangeEnd = new Date(currentYear, 5, 30);
  } else if (currentMonth === 10) {
    dateRangeStart = new Date(currentYear, 6, 1);
    dateRangeEnd = new Date(currentYear, 8, 31);
  }
  // }

  const checkQuarterlyEntitlement = await User.findAll({
    where: {
      retailerId: foundRetailer.id,
    },
    include: [
      {
        model: Transaction,
        where: {
          status: {
            [Op.not]: null,
          },
          createdAt: {
            [Op.between]: [dateRangeStart, dateRangeEnd],
          },
        },
      },
    ],
  });

  let userInfo = [];

  if (checkQuarterlyEntitlement) {
    for (let p = 0; p < checkQuarterlyEntitlement.length; p++) {
      userInfo.push({
        name: checkQuarterlyEntitlement[p].name,
        number: checkQuarterlyEntitlement[p].number,
        date: checkQuarterlyEntitlement[p].createdAt,
        amount_earned: `RM 5`,
      });
    }
  }

  const allRetailerWithSamePhoneNo = await Retailer.findAll({
    attributes: ["id", "name"],
    where: {
      active: true,
      number: selectedRetailer.number,
    },
  });

  const retailerClaimHistory = await Claim.findAll({
    where: { retailerId: foundRetailer.id },
  });

  const monthsToRetrieve = [1, 4, 7, 10];

  const getStatementID = await Claim.findOne({
    where: {
      retailerId: foundRetailer.id,
      [Op.or]: monthsToRetrieve.map((month) => ({
        createdAt: {
          [Op.between]: [
            new Date(currentYear, month - 1, 1),
            new Date(currentYear, month, 0),
          ],
        },
      })),
    },
  });

  const stores = allRetailerWithSamePhoneNo;
  const totalUser = registeredUserByRetailer.length;
  const totalSales = `${CURRENCY} ${totalUser * RECURIT_ENTITLEMENT_PER_USER}`;
  const getQuarterlyEntitlement = `${CURRENCY} ${
    checkQuarterlyEntitlement.length * RECURIT_ENTITLEMENT_PER_USER
  }`;

  try {
    if (foundRetailer) {
      return res.status(200).json({
        dashboardData: {
          id: foundRetailer.id,
          name: foundRetailer.name,
          group: foundRetailer.store_group,
          stores,
          totalUser,
          totalSales,
          promoter: foundRetailer.promoter,
        },
        retailerClaimHistory,
        getQuarterlyEntitlement: getQuarterlyEntitlement
          ? getQuarterlyEntitlement
          : `RM0`,
        userInfo,
        statementID: getStatementID ? getStatementID.statementID : null,
      });
    } else {
      return res.status(400).json({ error: "User not found" });
    }
  } catch (error) {
    return res.status(400).json({ error: "Internal Error" });
  }
});

// CHECK DSR SESSION-TOKEN
// POST @-> /api/dsr/session
router.post("/dsr/session", authorizeMwDSR, async (req, res) => {
  const foundDsr = req.currentDsr.data;
  const foundDsrType = req.currentDsr.type;

  if (!foundDsr) {
    return res.status(400).json({ error: "User not found" });
  }
  try {
    if (foundDsrType) {
      return res.status(200).json({
        dashboardData: {
          id: foundDsr.id,
          name: foundDsr.name,
          number: foundDsr.number,
          code: foundDsr.code,
          state: foundDsr.state,
        },
      });
    }
  } catch (error) {
    return res.status(400).json({ error: "Internal Error" });
  }
});

router.post("/store/details", authorizeMwDSR, async (req, res) => {
  const { id, name, number, code, state } = req.body;

  try {
    const checkRetailer = await Retailer.findByPk(id);
    if (!checkRetailer) {
      return res.status(400).json({ error: "retailer not found" });
    } else {
      (checkRetailer.name = name), (checkRetailer.number = number);
      checkRetailer.code = code;
      checkRetailer.state = state;
      await checkRetailer.save();

      return res.status(200).json({ message: "Update success" });
    }
  } catch (err) {
    console.error("Error when finding user in edit user details");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

// CHECK Upload Receipt
// POST @-> /api/receipt/uploadRetailer
router.post(
  "/receipt/uploadRetailer",
  authorizeMwRetailer,
  async (req, res) => {
    const { sendData } = req.body;
    const foundRetailer = req.currentRetailer.data;
    const { retailerId, resubmitTranId } = JSON.parse(sendData);
    const receipt = req.files && req.files.image ? req.files.image : null;

    if (!retailerId) {
      return res.status(400).json({ error: "Missing Details" });
    }

    try {
      const storeCheck = await Retailer.findByPk(retailerId);
      if (!storeCheck) {
        return res.status(400).json({ error: "Store not found" });
      }

      const receiptParam = {
        Bucket: process.env.BUCKETNAME,
        Key: `${process.env.S3TYPE}/receipt/${foundRetailer.id}/${generateCode(
          6
        )}`,
        Body: receipt.data,
        ContentType: receipt.mimetype,
      };

      s3Upload(receiptParam, async (err) => {
        if (err) {
          console.log("AWS UPLOAD ERROR");
          return res.status(400).json({ error: "Upload failed" });
        } else {
          const newUrl = await Promise.resolve(
            s3.getSignedUrlPromise("getObject", getParam)
          );

          const newTransaction = TagReceipt.build({
            status: "Pending",
            retailerId: foundRetailer.id,
            invoice_No: "",
            transactionId: savedTransaction.id,
            url: newUrl,
            image_key: receiptParam.Key,
          });

          const savedTransaction = await newTransaction.save();
          const s3 = new AWS.S3();
          const getParam = {
            Bucket: receiptParam.Bucket,
            Key: receiptParam.Key,
            Expires: 86400,
          };

          if (resubmitTranId) {
            const findResubmit = await TagReceipt.findOne({
              where: { id: resubmitTranId },
            });

            if (findResubmit) {
              console.log("found resubmit record");
              findResubmit.active = false;
              await findResubmit.save();
              console.log(resubmitTranId);
              return res.status(200).json({ data: "" });
            }
          }
          return res.status(200).json({ message: "success" });
        }
      });
    } catch (error) {
      // console.log("ERROR WHEN USER UPLOAD RECEIPT", error);
      return res.status(400).json({ error: "Internal Error" });
    }
  }
);

// CHECK NEW QR Code
// POST @-> /api/retailer/checkNewQr
router.post("/checkNewQr", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res
      .status(400)
      .json({ error: "Url is not defined.Please scan again" });
  }

  try {
    const findstorecode = await Retailer.findByPk(id);

    if (!findstorecode) {
      return res.status(400).json({ error: "Invalid QR Code" });
    } else {
      if (!findstorecode.name && !findstorecode.code) {
        return res.status(200).json({ isNewQr: true });
      } else {
        return res
          .status(400)
          .json({ error: "QR Code used", store: findstorecode });
      }
    }
  } catch (error) {
    return res.status(400).json({ error: "Invalid QR Code" });
  }
});

// Create and store retailer's payment information
router.post("/payment/info/create", authorizeMwRetailer, async (req, res) => {
  const { redeem_amount, paymentMethod, name, number, bankName, bankAccount } =
    req.body;
  const foundRetailer = req.currentRetailer.data;

  if (!foundRetailer || foundRetailer.promoter === true) {
    return res
      .status(400)
      .json({ error: "Retailer not found or user is under promoter type." });
  }

  if (!paymentMethod || !name) {
    return res.status(400).json({ error: "Missing payment details" });
  }

  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    // Check if the current date is between the 1st and 10th day of the allowed months (Jan, Apr, Jul, Oct)
    if (
      !(
        (
          (month === 1 || month === 4 || month === 7 || month === 10) &&
          day >= 1 &&
          day <= 10 &&
          year
        )
        // (month === 9 && day >= 1 && day <= 30)
      )
    ) {
      return res.status(400).json({
        error:
          "Retailer can only submit payment info between the 1st and 10th of January, April, July, or October.",
      });
    }

    // Generate a 6-digit statement ID
    genStatementID(async (err, statementID) => {
      if (err) {
        return res.status(500).json({ error: "Error generating statement ID" });
      }
      // Calculate the start and end timestamps for the date range (with milliseconds)
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(`${year}-${month}-10`);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const foundPaymentHistory = await Claim.findOne({
        where: {
          retailerId: foundRetailer.id,
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
      });

      if (foundPaymentHistory) {
        return res.status(400).json({
          error:
            "Retailer has submitted payment info before within the specified date range of the current month.",
        });
      } else {
        const savePaymentInfo = await Claim.create({
          retailerId: foundRetailer.id,
          paymentType: paymentMethod,
          name: name,
          number: number,
          bank_name: bankName,
          bank_account: bankAccount,
          status: "PENDING",
          redeem_amount: redeem_amount,
          statementID,
        });
        if (savePaymentInfo) {
          return res.status(200).json({
            message: "Retailer's payment info has been successfully added",
          });
        } else {
          return res
            .status(400)
            .json({ message: "Fail to save retailer's payment info" });
        }
      }
    });
  } catch (err) {
    console.error("Error when finding payment history");
    console.error(err);
    return res.status(400).json({ error: "Internal Error" });
  }
});

module.exports = router;
