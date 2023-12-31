const { Model, DataTypes, DATE } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT } = DataTypes;

class Otp extends Model {}

Otp.init(
	{
		number: {
			type: STRING,
			allowNull: false,
			comment: "User number for receiving the otp",
		},
		otp: {
			type: STRING,
			allowNull: false,
			comment: "otp number",
		},
		expiredAt: {
			type: DATE,
			allowNull: false,
			comment: "validation for expiration",
		},
	},
	{
		sequelize,
		comment: "To store all otp records",
		tableName: "otp",
		modelName: "otp",
	}
);

module.exports = Otp;
