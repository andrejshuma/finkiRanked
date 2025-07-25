require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});
const { sendHourlyReviewNotification } = require('../services/emailService');
const schedule = require('node-schedule');
const prisma = require('../lib/prisma');

async function checkForNewReviews() {
  const scriptExecutionTime = new Date();
  const currentHour = scriptExecutionTime.getHours();

  if (currentHour >= 1 && currentHour < 7) {
    console.log(
      `[${scriptExecutionTime.toISOString()}] Skipping hourly review check (between 1AM and 7AM).`
    );
    return;
  }
  console.log(
    `[${scriptExecutionTime.toISOString()}] Starting hourly review check process`
  );

  try {
    const posts = await prisma.to_be_reviewed.findMany({
      where: {
        topic: 'daily-challenge',
      },
      select: {
        title: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    console.log(
      `[${scriptExecutionTime.toISOString()}] Found ${
        posts.length
      } daily-challenge post(s) awaiting review.`
    );

    if (posts.length === 0) {
      console.log(
        `[${scriptExecutionTime.toISOString()}] No new posts to review. Skipping email notification.`
      );
      return;
    }

    const moderators = await prisma.users.findMany({
      where: { isModerator: true },
      select: { email: true },
    });

    if (moderators.length === 0) {
      console.log(
        `[${scriptExecutionTime.toISOString()}] Found posts, but no moderators are defined.`
      );
      return;
    }

    const moderatorEmails = moderators.map((m) => m.email);
    console.log(
      `[${scriptExecutionTime.toISOString()}] Sending hourly notifications to ${
        moderatorEmails.length
      } moderators.`
    );

    for (const email of moderatorEmails) {
      try {
        await sendHourlyReviewNotification(email, posts);
        console.log(
          `[${scriptExecutionTime.toISOString()}] Hourly notification sent to ${email}`
        );
      } catch (emailError) {
        console.error(
          `[${scriptExecutionTime.toISOString()}] Error sending hourly notification to ${email}:`,
          emailError
        );
      }
    }

    console.log(
      `[${scriptExecutionTime.toISOString()}] Hourly notification process completed.`
    );
  } catch (error) {
    console.error(
      `[${scriptExecutionTime.toISOString()}] Error in hourly review check script:`,
      error
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log(
      `[${scriptExecutionTime.toISOString()}] Prisma client disconnected.`
    );
  }
}

// Schedule the job to run at the start of every hour ('0 * * * *')
const job = schedule.scheduleJob('0 * * * *', function () {
  console.log(
    `[${new Date().toISOString()}] Running scheduled hourly review check`
  );
  checkForNewReviews();
});

console.log(
  `[${new Date().toISOString()}] Hourly review check script initialized.`
);
console.log(
  `[${new Date().toISOString()}] Next scheduled hourly run: ${job.nextInvocation()}`
);

process.on('SIGINT', function () {
  job.cancel();
  console.log(`[${new Date().toISOString()}] Hourly review scheduler stopped`);
  process.exit(0);
});
