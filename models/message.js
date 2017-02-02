module.exports = function (sequelize, DataTypes) {
	return sequelize.define('message', {
		text: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250]
			}
		},
		user: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250]
			}
		},
		room: {
			type: DataTypes.STRING,
			allowNull: true,
			validate: {
				len: [1, 250]
			}
		},
		timestamp: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {}
		}
	});
};