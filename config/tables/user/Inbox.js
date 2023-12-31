const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, INTEGER, STRING, BOOLEAN } = DataTypes;

class Inbox extends Model {}

Inbox.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		title: {
			type: STRING(99999),
			allowNull: false,
			comment: "Title of the message"
		},
		description: {
			type: STRING(99999),
			allowNull: false,
			comment: "Description of the message"
		},
		isRead: {
			type: BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "is read"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "To store all personalized message or notification",
		tableName: "inbox",
		modelName: "inbox"
	}
);

// userId

module.exports = Inbox;
