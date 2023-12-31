require("dotenv").config();

const registrationMessage = (otp, language) => {
  if (language === "chinese") {
    return `您的验证码是${otp}`;
  } else {
    return `Your OTP verification code is ${otp}`;
  }
};

const approvedMessage = (code, language) => {
  if (language === "chinese") {
    // return `您的收据已获批准。请点击${url}兑换 ${code}`;
  } else {
    return `Your receipt was approved. Here is your voucher: ${code}`;
  }
};

const rejectedMessage = (reason, url, language) => {
  if (language === "chinese") {
    let rejectReason = "";

    if (reason === "Invalid receipt uploaded") {
      rejectReason = "上传的收据无效";
    } else if (reason === "Invalid SKU product purchased") {
      rejectReason = "购买的产品 SKU 无效";
    } else if (reason === "Duplicated receipt uploaded") {
      rejectReason = "上传了重复的收据";
    } else if (reason === "Incomplete receipt uploaded") {
      rejectReason = "上传的收据不完整";
    } else if (reason === "Receipt images combined uploaded") {
      rejectReason = "上传的收据图片被合并";
    } else if (reason === "Purchase amount below minimum tier") {
      rejectReason = "购买金额低于最低门槛";
    } else if (reason === "Receipt missing store name") {
      rejectReason = "缺少店名";
    } else if (reason === "Receipt missing date") {
      rejectReason = "缺少购买日期";
    } else if (reason === "Receipt missing invoice number") {
      rejectReason = "缺少发票号码";
    } else if (reason === "Receipt missing purchase amount") {
      rejectReason = "缺少购买金额";
    } else if (reason === "Receipt not within campaign period") {
      rejectReason = "不在活动期间购买";
    } else if (reason === "Receipt image is unclear") {
      rejectReason = "收据图片不清晰";
    } else if (reason === "Handwritten receipt is not acceptable") {
      rejectReason = "手写收据不被接受";
    } else if (reason === "Maximum redemption reached") {
      rejectReason = "已达到最大赎回次数";
    } else if (reason === "Brand has been redeemed") {
      rejectReason = "品牌已被赎回";
    } else if (reason === "No rebate shown on the receipt") {
      rejectReason = "收据上没有折扣信息";
    } else if (reason === "Not the participating store") {
      rejectReason = "非参与商店";
    } 

    return `收据因${rejectReason}被拒绝。请在 ${url} 重新提交。`;
  } else {
    return `Rejected receipt,${reason}.Resubmit at ${url}`;
  }
};
// export
module.exports = {
  registrationMessage,
  approvedMessage,
  rejectedMessage,
};
