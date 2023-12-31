const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING } = DataTypes;

class MailLogs extends Model {}

MailLogs.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		type: {
			type: STRING,
			allowNull: false,
			comment: "type of email"
		},
		recipient: {
			type: STRING,
			allowNull: false,
			comment: "recipient email address"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "All outgoing mail logs",
		tableName: "mailLogs",
		modelName: "mailLogs"
	}
);

module.exports = MailLogs;
