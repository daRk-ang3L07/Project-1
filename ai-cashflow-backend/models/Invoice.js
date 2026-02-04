// src/models/Invoice.js
module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
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
    clientId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      }
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Invoice number extracted from document'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date invoice was issued'
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date payment is officially due'
    },
    predictedPaymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'AI-predicted actual payment date'
    },
    actualPaymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Actual date payment was received'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'paid', 'overdue', 'cancelled'),
      defaultValue: 'pending'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Confidence score for payment prediction (0-1)'
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'S3 URL of uploaded invoice document'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reminderCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastReminderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'invoices',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['clientId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['dueDate']
      }
    ]
  });

  // Instance method to calculate days overdue
  Invoice.prototype.getDaysOverdue = function() {
    if (this.status === 'paid') return 0;
    
    const today = new Date();
    const due = new Date(this.dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Instance method to check if should send reminder
  Invoice.prototype.shouldSendReminder = function() {
    if (this.status === 'paid' || this.status === 'cancelled') return false;
    
    const daysOverdue = this.getDaysOverdue();
    
    // Logic: Send reminder if overdue and no reminder in last 7 days
    if (daysOverdue > 0) {
      if (!this.lastReminderDate) return true;
      
      const daysSinceLastReminder = Math.ceil(
        (new Date() - new Date(this.lastReminderDate)) / (1000 * 60 * 60 * 24)
      );
      
      return daysSinceLastReminder >= 7;
    }
    
    return false;
  };

  // Define associations
  Invoice.associate = (models) => {
    Invoice.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Invoice.belongsTo(models.Client, {
      foreignKey: 'clientId',
      as: 'client'
    });
    Invoice.hasMany(models.PaymentHistory, {
      foreignKey: 'invoiceId',
      as: 'paymentHistory',
      onDelete: 'CASCADE'
    });
  };

  return Invoice;
};