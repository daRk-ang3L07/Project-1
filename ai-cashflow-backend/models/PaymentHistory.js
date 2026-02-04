// src/models/PaymentHistory.js
module.exports = (sequelize, DataTypes) => {
  const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    daysToPayment: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual days taken from issue date to payment'
    },
    wasReminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    numberOfReminders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., bank transfer, check, credit card'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'payment_history',
    timestamps: true
  });

  // Define associations
  PaymentHistory.associate = (models) => {
    PaymentHistory.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice'
    });
  };

  return PaymentHistory;
};