class Challenge {
  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title || '';
    this.content = data.content || '';
    this.solving_date = data.solving_date;
    this.attempted_by = data.attempted_by;
    this.solved_by = data.solved_by;
    this.expired = data.expired || false;
    this.examples = data.examples;
    this.test_cases = data.test_cases;
    this.output_type = data.output_type;
  }
}

module.exports = Challenge;
