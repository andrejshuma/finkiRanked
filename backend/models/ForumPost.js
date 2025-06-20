class ForumPost {
  constructor(data = {}) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.authorName = data.authorName;
    this.dateCreated = data.dateCreated || new Date();
    this.comments = [];
    this.comment_count = data.commentCount || 0;
  }
}

module.exports = ForumPost;
