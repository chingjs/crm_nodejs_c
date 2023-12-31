require("dotenv").config();
const { NODE_ENV } = process.env;

const placeOrder = async (orderObj, callback) => {
  console.log("creating delivery");
  if (NODE_ENV === "production" && orderObj.itemList > 0) {
    if (orderObj.deliveryOption === "Self Collect") {
      console.log("go self collect");
      callback();
    } else if (orderObj.deliveryOption === "Delivery") {
      console.log("go delivery");
      callback();
    } else {
      callback();
    }
  } else {
    console.log("voucher only");
    callback();
  }
};

module.exports = {
  placeOrder,
};
