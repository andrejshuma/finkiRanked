class Comment {
  constructor(data = {}) {
    this.id = data.id;
    this.content = data.content;
    this.authorName = data.authorName;
    this.dateCreated = new Date();
    this.authorId = data.authorId;
  }
}

module.exports = Comment;
