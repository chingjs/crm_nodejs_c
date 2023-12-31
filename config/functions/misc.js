const async = require("async");
const User = require("../tables/user/User");
const Order = require("../tables/transaction/Order");
const Point = require("../tables/user/Point");
const Sequence = require("../../config/tables/misc/Sequence");
const { Op } = require("sequelize");
const TierHistory = require("../tables/misc/TierHistory");
const Claim = require("../../config/tables/store/Claim");

// ================================================== GLOBAL VARIABLES ================================================== //
const nums = "0123456789";
const lowerAlpha = "abcdefghijklmnopqrstuvwxyz";
const chars = nums + lowerAlpha;

const randomValue = (length, type, capOnly) => {
  let value = "";
  if (type === "number") {
    // numbers
    for (let i = 0; i < length; i++) {
      value += nums[Math.floor(Math.random() * nums.length)];
    }
  } else if (type === "alphabet") {
    // alphabet
    for (let i = 0; i < length; i++) {
      value += lowerAlpha[Math.floor(Math.random() * lowerAlpha.length)];
    }
  } else {
    // alphanumeric
    for (let i = 0; i < length; i++) {
      value += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  if (capOnly && capOnly === true) return value.toUpperCase();
  else if (capOnly && capOnly === "random") {
    return value
      .split("")
      .map((x) => {
        const bool = Math.random() < 0.5;
        if (bool) return x.toUpperCase();
        return x;
      })
      .join("");
  }

  return value;
};


const makeid = (length) => {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


const genUserID = (callback) => {
  console.log("GENERATE REFER CODE");
  let newID = randomValue(6, "number");
  User.findOne({ where: { referralCode: newID } })
    .then((found) => {
      if (found) {
        genUserID(callback);
        console.log("RECURSION OCCURED", newID);
      } else {
        console.log("NO RECURSION OCCURED");
        callback(null, newID);
      }
    })
    .catch((err) => {
      console.error(
        "Error when finding user with this refer code in generate refer code"
      );
      console.error(err);
      callback(err, null);
    });
};

const genTrackingNum = (callback) => {
  console.log("GENERATE TRACKING NUMBER");
  let trackingId = randomValue(9, "number");

  Order.findOne({ where: { trackingId } })
    .then((found) => {
      if (found) {
        genTrackingNum(callback);
      } else {
        console.log("NO RECURSION OCCURED");
        callback(null, trackingId);
      }
    })
    .catch((err) => {
      console.error(
        "Error when finding exist tracking id in generate tracking number"
      );
      console.error(err);
      callback(err, null);
    });
};

const genNewTrackingNum = (type, callback) => {
  Sequence.findOne({ where: { type } })
    .then((foundSequence) => {
      if (!foundSequence) callback("Wrong parameter value provided.");

      Sequence.update(
        { currentSequence: foundSequence.currentSequence + 1 },
        { where: { type, updatedAt: foundSequence.updatedAt } }
      )
        .then((updated) => {
          if (updated[0] === 1) {
            const prefix = "PS";
            const maxLength = 11;
            const currentSequence = foundSequence.currentSequence;
            const currentSequenceLength = currentSequence.toString().length;
            let trackingNumber = "";
            for (let i = maxLength - currentSequenceLength; i > 0; i--) {
              trackingNumber += "0";
            }
            const trackingId = `${prefix}${trackingNumber}${currentSequence}`;
            callback(null, trackingId);
          } else {
            console.log("Tracking ID Recursion");
            genNewTrackingNum(type, callback);
          }
        })
        .catch((err) => {
          console.error("Error when updating tracking ID sequence");
          console.error(err);
          callback("Internal Error");
        });
    })
    .catch((err) => {
      console.error("Error when finding sequence in new tracking format");
      console.error(err);
      callback("Internal Error");
    });
};


async function getTotalEarn(userId) {
  // // 500
  // // Member -> Bronze
  // // 500/250 - 250/350
  // // 250 
  try {
    const sumOfPoints = await Point.sum("points", {
      where: {
        userId: userId,
        active: true,
      },
    });

    return sumOfPoints;
  } catch (error) {
    console.error("Error calculating points:", error);
    throw error;
  }
}

const beautifyNumber = (number) => {
  if (number[0] !== "0") {
    return "+" + number;
  } else {
    return "+6" + number;
  }
};

const sqlDate = (d) => {
  const date = d ? new Date(d) : new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (month.toString().length < 2) month = `0${month}`;
  if (day.toString().length < 2) day = `0${day}`;

  return `${year}-${month}-${day}`;
};

const generateCode = (length) => {
  let max = "";
  let min = "";
  for (let i = 0; i < length; i++) {
    max += "9";
    min += "1";
  }
  max = parseInt(max);
  min = parseInt(min);

  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp;
};


const genStatementID = (callback) => {
  console.log("GENERATE STATEMENT ID");
  let newID = randomValue(6, "number"); 
  // Check if the generated statement ID already exists
  Claim.findOne({ where: { statementID: newID } })
    .then((found) => {
      if (found) {
        // If it exists, generate a new one (you can use recursion)
        genStatementID(callback);
        console.log("RECURSION OCCURRED", newID);
      } else {
        console.log("NO RECURSION OCCURRED");
        callback(null, newID);
      }
    })
    .catch((err) => {
      console.error("Error when finding statement with this ID in generate statement ID");
      console.error(err);
      callback(err, null);
    });
};


module.exports = {
  genUserID,
  randomValue,
  genNewTrackingNum,
  beautifyNumber,
  makeid,
  sqlDate,
  generateCode,
  getTotalEarn,
  genStatementID,
};
