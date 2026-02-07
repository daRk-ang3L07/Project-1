// src/controllers/dashboardController.js
const db = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all invoices for calculations
    const allInvoices = await db.Invoice.findAll({
      where: { userId },
      attributes: ['amount', 'status', 'dueDate', 'actualPaymentDate']
    });

    // Calculate outstanding invoices (pending + overdue)
    const outstandingInvoices = allInvoices.filter(
      inv => inv.status === 'pending' || inv.status === 'overdue'
    );
    const outstandingAmount = outstandingInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amount), 0
    );

    // Calculate overdue invoices
    const today = new Date();
    const overdueInvoices = allInvoices.filter(
      inv => (inv.status === 'pending' || inv.status === 'overdue') &&
             new Date(inv.dueDate) < today
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.amount), 0
    );

    // Calculate expected this week
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const expectedThisWeek = allInvoices.filter(
      inv => (inv.status === 'pending' || inv.status === 'overdue') &&
             inv.predictedPaymentDate &&
             new Date(inv.predictedPaymentDate) <= oneWeekFromNow &&
             new Date(inv.predictedPaymentDate) >= today
    );
    const expectedThisWeekAmount = expectedThisWeek.reduce(
      (sum, inv) => sum + parseFloat(inv.amount), 0
    );

    // Calculate this month revenue (paid invoices)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const thisMonthPaid = allInvoices.filter(
      inv => inv.status === 'paid' &&
             inv.actualPaymentDate &&
             new Date(inv.actualPaymentDate) >= startOfMonth &&
             new Date(inv.actualPaymentDate) <= endOfMonth
    );
    const thisMonthRevenue = thisMonthPaid.reduce(
      (sum, inv) => sum + parseFloat(inv.amount), 0
    );

    // Calculate next month forecast (based on predicted payments)
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    const nextMonthPredicted = allInvoices.filter(
      inv => (inv.status === 'pending' || inv.status === 'overdue') &&
             inv.predictedPaymentDate &&
             new Date(inv.predictedPaymentDate) >= nextMonthStart &&
             new Date(inv.predictedPaymentDate) <= nextMonthEnd
    );
    const nextMonthForecast = nextMonthPredicted.reduce(
      (sum, inv) => sum + parseFloat(inv.amount), 0
    );

    // Calculate average payment time
    const paidInvoices = allInvoices.filter(inv => inv.status === 'paid' && inv.actualPaymentDate);
    let avgPaymentDays = 30; // default
    
    if (paidInvoices.length > 0) {
      const paymentHistories = await db.PaymentHistory.findAll({
        where: {
          invoiceId: paidInvoices.map(inv => inv.id)
        },
        attributes: ['daysToPayment']
      });
      
      if (paymentHistories.length > 0) {
        const totalDays = paymentHistories.reduce(
          (sum, ph) => sum + (ph.daysToPayment || 0), 0
        );
        avgPaymentDays = Math.round(totalDays / paymentHistories.length);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        outstanding: {
          amount: parseFloat(outstandingAmount.toFixed(2)),
          count: outstandingInvoices.length
        },
        expectedThisWeek: {
          amount: parseFloat(expectedThisWeekAmount.toFixed(2)),
          count: expectedThisWeek.length
        },
        overdue: {
          amount: parseFloat(overdueAmount.toFixed(2)),
          count: overdueInvoices.length
        },
        thisMonthRevenue: {
          amount: parseFloat(thisMonthRevenue.toFixed(2)),
          count: thisMonthPaid.length
        },
        nextMonthForecast: {
          amount: parseFloat(nextMonthForecast.toFixed(2)),
          count: nextMonthPredicted.length
        },
        avgPaymentDays: avgPaymentDays
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

// @desc    Get cash flow forecast for next 60 days
// @route   GET /api/dashboard/forecast
// @access  Private
const getCashFlowForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 60;

    // Get pending/overdue invoices with predictions
    const invoices = await db.Invoice.findAll({
      where: {
        userId,
        status: {
          [Op.in]: ['pending', 'overdue']
        }
      },
      include: [
        {
          model: db.Client,
          as: 'client',
          attributes: ['name']
        }
      ],
      order: [['predictedPaymentDate', 'ASC']]
    });

    // Create forecast data points
    const today = new Date();
    const forecastData = [];

    for (let i = 0; i <= days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Calculate expected income for this date
      const expectedIncome = invoices
        .filter(inv => {
          if (!inv.predictedPaymentDate) return false;
          const predDate = new Date(inv.predictedPaymentDate).toISOString().split('T')[0];
          return predDate === dateStr;
        })
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      // You can add expenses here later (for now, set to 0)
      const expectedExpenses = 0;

      if (i === 0 || expectedIncome > 0 || expectedExpenses > 0) {
        forecastData.push({
          date: dateStr,
          expectedIncome: parseFloat(expectedIncome.toFixed(2)),
          expectedExpenses: parseFloat(expectedExpenses.toFixed(2)),
          netCashFlow: parseFloat((expectedIncome - expectedExpenses).toFixed(2))
        });
      }
    }

    // Calculate running balance (starting from $0 for now)
    let runningBalance = 0;
    forecastData.forEach(point => {
      runningBalance += point.netCashFlow;
      point.projectedBalance = parseFloat(runningBalance.toFixed(2));
    });

    res.status(200).json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    console.error('Cash flow forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating cash flow forecast',
      error: error.message
    });
  }
};

// @desc    Get alerts and recommended actions
// @route   GET /api/dashboard/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const alerts = [];

    // Get overdue invoices
    const today = new Date();
    const overdueInvoices = await db.Invoice.findAll({
      where: {
        userId,
        status: {
          [Op.in]: ['pending', 'overdue']
        },
        dueDate: {
          [Op.lt]: today
        }
      },
      include: [
        {
          model: db.Client,
          as: 'client',
          attributes: ['name']
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.amount), 0
      );

      alerts.push({
        type: 'urgent',
        priority: 'high',
        title: `${overdueInvoices.length} overdue invoices`,
        message: `Total of $${totalOverdue.toFixed(2)} is overdue`,
        action: 'send_reminders',
        actionLabel: 'Send Payment Reminders',
        relatedInvoices: overdueInvoices.slice(0, 3).map(inv => ({
          id: inv.id,
          client: inv.client?.name,
          amount: parseFloat(inv.amount),
          dueDate: inv.dueDate
        }))
      });
    }

    // Check for cash flow warnings (negative balance in next 30 days)
    const forecastData = await getCashFlowData(userId, 30);
    const negativeBalances = forecastData.filter(point => point.projectedBalance < 0);

    if (negativeBalances.length > 0) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        title: 'Cash flow warning',
        message: `Potential cash shortfall detected in ${negativeBalances.length} days`,
        action: 'view_forecast',
        actionLabel: 'View Cash Flow Forecast'
      });
    }

    // Check for slow-paying clients
    const clients = await db.Client.findAll({
      where: {
        userId,
        averagePaymentDays: {
          [Op.gt]: 45
        }
      },
      order: [['averagePaymentDays', 'DESC']],
      limit: 3
    });

    if (clients.length > 0) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        title: 'Slow-paying clients detected',
        message: `${clients.length} clients averaging ${Math.round(clients[0].averagePaymentDays)}+ days to pay`,
        action: 'view_clients',
        actionLabel: 'Review Client Payment Terms'
      });
    }

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

// Helper function
async function getCashFlowData(userId, days) {
  const invoices = await db.Invoice.findAll({
    where: {
      userId,
      status: { [Op.in]: ['pending', 'overdue'] }
    }
  });

  const today = new Date();
  const forecastData = [];
  let runningBalance = 0;

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const expectedIncome = invoices
      .filter(inv => {
        if (!inv.predictedPaymentDate) return false;
        const predDate = new Date(inv.predictedPaymentDate).toISOString().split('T')[0];
        return predDate === dateStr;
      })
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    runningBalance += expectedIncome;
    
    forecastData.push({
      date: dateStr,
      projectedBalance: runningBalance
    });
  }

  return forecastData;
}

// @desc    Get recent invoices for dashboard
// @route   GET /api/dashboard/recent-invoices
// @access  Private
const getRecentInvoices = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const invoices = await db.Invoice.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: db.Client,
          as: 'client',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Recent invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent invoices',
      error: error.message
    });
  }
};

// @desc    Get top clients by payment behavior
// @route   GET /api/dashboard/top-clients
// @access  Private
const getTopClients = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const clients = await db.Client.findAll({
      where: { userId: req.user.id },
      attributes: [
        'id',
        'name',
        'averagePaymentDays',
        'paymentReliability',
        'totalInvoiced',
        'totalPaid',
        'invoiceCount'
      ],
      order: [['totalInvoiced', 'DESC']],
      limit
    });

    // Calculate outstanding for each client
    const clientsWithOutstanding = await Promise.all(
      clients.map(async (client) => {
        const outstandingInvoices = await db.Invoice.findAll({
          where: {
            clientId: client.id,
            status: { [Op.in]: ['pending', 'overdue'] }
          },
          attributes: ['amount']
        });

        const outstanding = outstandingInvoices.reduce(
          (sum, inv) => sum + parseFloat(inv.amount), 0
        );

        return {
          ...client.toJSON(),
          outstanding: parseFloat(outstanding.toFixed(2))
        };
      })
    );

    res.status(200).json({
      success: true,
      count: clientsWithOutstanding.length,
      data: clientsWithOutstanding
    });
  } catch (error) {
    console.error('Top clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top clients',
      error: error.message
    });
  }
};

module.exports = {
  getSummary,
  getCashFlowForecast,
  getAlerts,
  getRecentInvoices,
  getTopClients
};