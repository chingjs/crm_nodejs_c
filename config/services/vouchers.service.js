const { Sequelize } = require("sequelize");
const Voucher = require("../tables/settings/voucher/Voucher");

const getAvailableVouchersByTypeAndCount = () => {
	return Voucher.findAll({
		attributes: ["type", [Sequelize.fn("COUNT", Sequelize.col("*")), "count"]],
		where: {
			redeemed: false,
			used: false,
			userId: null,
			transactionId: null,
		},
		group: ["type"],
	}).then((result) => {
		const typeCountObject = {};
		result.forEach(({ dataValues }) => {
			typeCountObject[dataValues.type] = +dataValues.count;
		});

		return typeCountObject;
	});
};

module.exports = { getAvailableVouchersByTypeAndCount };
