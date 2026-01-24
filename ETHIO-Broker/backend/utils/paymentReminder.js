const cron = require("node-cron");
const Payment = require("../models/paymentModel");

// Run daily at 9 AM
cron.schedule("0 9 * * *", async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const duePayments = await Payment.find({
    paymentStatus: "Pending",
    dueDate: { $lte: tomorrow, $gte: new Date() },
  })
    .populate("user")
    .populate("property");

  // Send reminder emails
  for (const payment of duePayments) {
    await sendPaymentReminder(payment);
  }
});
