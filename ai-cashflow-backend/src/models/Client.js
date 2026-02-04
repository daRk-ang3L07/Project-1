// src/models/Client.js
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Payment behavior metrics (learned over time)
    averagePaymentDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
      comment: 'Average days taken to pay invoices'
    },
    paymentReliability: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.5,
      comment: 'Score from 0-1 indicating payment reliability'
    },
    totalInvoiced: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      comment: 'Total amount invoiced to this client'
    },
    totalPaid: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      comment: 'Total amount paid by this client'
    },
    invoiceCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of invoices for this client'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['email']
      }
    ]
  });

  // Define associations
  Client.associate = (models) => {
    Client.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Client.hasMany(models.Invoice, {
      foreignKey: 'clientId',
      as: 'invoices',
      onDelete: 'CASCADE'
    });
  };

  return Client;
};