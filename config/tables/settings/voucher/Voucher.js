const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, DATE, STRING, BOOLEAN, FLOAT } = DataTypes;

class Voucher extends Model {}

Voucher.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		code: {
			type: STRING,
			allowNull: false,
			comment: "unique voucher code"
		},
		redeemed: {
			type: BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "is redeeemed"
		},
		redeemedDate: {
			type: DATE,
		},
		amount: {
			type: FLOAT,
			allowNull: false,
			comment: "amount of the voucher"
		},
		dateuse: {
			type: DATE,
			allowNull: true,
			comment: 'Used Date',
		  },
		used: {
			type: BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "user used this voucher or not"
		},
		shopper: {
			type: BOOLEAN,
		},
		type: {
			type: STRING,
			allowNull: false,
			comment: "user voucher type"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "vindamall evoucher",
		tableName: "voucher",
		modelName: "voucher",
	
	}
);

// voucherTypeId
// voucherBatchId
// userId

module.exports = Voucher;
