const { get } = require('http');
const prisma = require('../lib/prisma');

const getTaskByDate = async (req, res) => {
  const { date } = req.params;

  try {
    const now = new Date();

    let effectiveDate;

    const localDate = now.toLocaleDateString('en-CA');

    if (date === localDate) {
      if (now.getHours() < 7) {
        effectiveDate = new Date(now);
        effectiveDate.setDate(now.getDate() - 1);
      } else {
        effectiveDate = now;
      }
    } else {
      return res
        .status(404)
        .json({ message: 'Cannot fetch task for different date!' });
    }

    const taskDate = new Date(
      Date.UTC(
        effectiveDate.getUTCFullYear(),
        effectiveDate.getUTCMonth(),
        effectiveDate.getUTCDate()
      )
    );

    let tasks = await prisma.challenges.findMany({
      where: {
        solving_date: taskDate,
        expired: false,
      },
      include: {
        test_cases: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found for this date' });
    }

    const safeSerialize = (data) => {
      return JSON.parse(
        JSON.stringify(data, (key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        })
      );
    };

    const processedTasks = tasks.map((task) => {
      const safeTask = safeSerialize(task);

      if (safeTask.test_cases) {
        safeTask.test_cases = safeTask.test_cases.map((testCase) => ({
          id: testCase.id,
          input: testCase.input || '',
          output: testCase.output || '',
          challenge_id: testCase.challenge_id,
        }));
      }

      return safeTask;
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(processedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);

    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

const fetchTestCaseForToday = async (req, res) => {
  const { id } = req.params;

  try {
    const testCases = await prisma.test_cases.findMany({
      where: {
        challenge_id: id,
      },
      select: {
        id: true,
        input: true,

        challenge_id: true,
      },
    });

    if (testCases.length === 0) {
      return res.status(404).json({ message: 'No test cases found for today' });
    }

    const randomTestCase =
      testCases[Math.floor(Math.random() * testCases.length)];

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(randomTestCase);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};
const RANK_DATA = {
  Novice: { id: 1, title: 'Novice', requiredPoints: 0 },
  Learner: { id: 2, title: 'Learner', requiredPoints: 300 },
  Coder: { id: 3, title: 'Coder', requiredPoints: 800 },
  'Problem Solver': { id: 4, title: 'Problem Solver', requiredPoints: 1500 },
  Algorithmist: { id: 5, title: 'Algorithmist', requiredPoints: 2500 },
  'Hacker Mage': { id: 6, title: 'Hacker Mage', requiredPoints: 4000 },
  Challenger: { id: 7, title: 'Challenger', requiredPoints: 6000 },
  'Code Master': { id: 8, title: 'Code Master', requiredPoints: 8500 },
  'FINKI Royalty': { id: 9, title: 'FINKI Royalty', requiredPoints: 11000 },
  'FINKI Legend': { id: 10, title: 'FINKI Legend', requiredPoints: 16000 },
};

function getRankByPoints(points) {
  const ranks = Object.values(RANK_DATA).sort(
    (a, b) => b.requiredPoints - a.requiredPoints
  );
  for (const rank of ranks) {
    if (points >= rank.requiredPoints) {
      return rank;
    }
  }
  return RANK_DATA['Novice'];
}

function getMinutesSinceSevenAM() {
  const now = new Date();
  const sevenAM = new Date();
  sevenAM.setHours(7, 0, 0, 0);
  if (now < sevenAM) {
    sevenAM.setDate(sevenAM.getDate() - 1);
  }
  const diffMs = now.getTime() - sevenAM.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

function getTimeBonus() {
  const minutes = getMinutesSinceSevenAM();
  console.log('Minutes since 7 AM:', minutes);
  return Math.max(0, 60 - Math.floor(minutes * 0.0833));
}

function getAttemptScore(attempts) {
  const maxScore = 40;
  const decayPerAttempt = 5;
  const minScore = 5;

  const score = maxScore - (attempts - 1) * decayPerAttempt;
  return Math.max(minScore, score);
}

function isOutputCorrect(userOutput, expectedOutput, outputType) {
  const normalizeString = (str) =>
    str.toLowerCase().replace(/[,"']/g, '').replace(/\s+/g, ' ').trim();

  const normalizeArray = (str) => {
    const cleaned = str.replace(/[\[\]]/g, '');
    return cleaned
      .split(/[\s,]+/)
      .filter((val) => val !== '')
      .map((val) => val.trim());
  };

  if (outputType === 'integer') {
    return parseInt(userOutput) === parseInt(expectedOutput);
  }

  if (outputType === 'float') {
    return Math.abs(parseFloat(userOutput) - parseFloat(expectedOutput)) < 1e-6;
  }
  if (outputType === 'array') {
    const userArr = normalizeArray(userOutput);
    const expectedArr = normalizeArray(expectedOutput);
    if (userArr.length !== expectedArr.length) return false;
    for (let i = 0; i < userArr.length; i++) {
      if (userArr[i] !== expectedArr[i]) return false;
    }
    return true;
  }
  const a = normalizeString(userOutput);
  const b = normalizeString(expectedOutput);
  return a === b;
}

const evaluateTask = async (req, res) => {
  const { id: taskId } = req.params;
  const { userOutput, testCaseId, userId } = req.body;
  console.log(userOutput, testCaseId, userId);
  try {
    if (!testCaseId || !userOutput || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const testCase = await prisma.test_cases.findUnique({
      where: {
        id: testCaseId,
      },
    });

    if (testCase.challenge_id !== taskId) {
      return res
        .status(400)
        .json({ message: 'Test case does not belong to the task' });
    }
    let user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    let attempts = user.attempts || 0;
    await prisma.challenges.update({
      where: {
        id: taskId,
      },
      data: {
        attempted_by: { increment: 1 },
      },
    });

    const task = await prisma.challenges.findUnique({
      where: {
        id: taskId,
      },
    });
    if (isOutputCorrect(userOutput, testCase.output, task.output_type)) {
      const timeBonus = getTimeBonus();
      const attemptScore = getAttemptScore(attempts + 1);
      const difficultyScore =
        task.difficulty === 'Easy'
          ? 10
          : task.difficulty === 'Medium'
          ? 20
          : 30;
      const totalScore = timeBonus + attemptScore + difficultyScore;
      const userRank = getRankByPoints(totalScore);
      const updatedUser = await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          points: { increment: totalScore },
          attempts: { increment: 1 },
          solvedDailyChallenge: true,
          solved_problems: { increment: 1 },
          rank: userRank.title,
        },
      });
      const responseUser = { ...updatedUser };

      if (typeof responseUser.points === 'bigint') {
        responseUser.points = responseUser.points.toString();
      }

      console.log('User Rank:', userRank);
      await prisma.challenges.update({
        where: { id: taskId },
        data: { solved_by: { increment: 1 } },
      });

      return res.status(200).json({
        success: true,
        message: 'Task solved successfully!',
        scoreAwarded: totalScore,
        newTotalPoints: responseUser.points,
        rank: userRank.title,
        rankInfo: userRank,
      });
    } else {
      const newAttempts = attempts + 1;
      await prisma.users.update({
        where: { id: userId },
        data: {
          attempts: newAttempts,
        },
      });
      return res.status(200).json({
        success: false,
        message: 'Incorrect solution. Try again!',
        attemptsMade:
          typeof newAttempts === 'bigint'
            ? newAttempts.toString()
            : newAttempts,
      });
    }
  } catch (error) {
    console.error('Error evaluating task:', error);
    return res.status(500).json({
      message: 'Internal server error during evaluation.',
      error: error.message,
    });
  }
};
module.exports = {
  getTaskByDate,

  fetchTestCaseForToday,
  evaluateTask,
};
