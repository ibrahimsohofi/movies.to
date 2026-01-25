-- List Collaborators Table
CREATE TABLE IF NOT EXISTS list_collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'editor' CHECK(role IN ('viewer', 'editor', 'admin')),
  invited_by INTEGER,
  invite_token TEXT UNIQUE,
  invite_expires_at DATETIME,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_collaborators_list_id ON list_collaborators(list_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_user_id ON list_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_list_collaborators_invite_token ON list_collaborators(invite_token);

-- List Activity Log Table
CREATE TABLE IF NOT EXISTS list_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK(action_type IN (
    'movie_added', 'movie_removed', 'movie_reordered',
    'collaborator_invited', 'collaborator_removed', 'collaborator_role_changed',
    'list_updated', 'list_created', 'comment_added'
  )),
  target_movie_id INTEGER,
  target_user_id INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_list_activity_list_id ON list_activity_log(list_id);
CREATE INDEX IF NOT EXISTS idx_list_activity_created_at ON list_activity_log(created_at);

-- List Comments Table
CREATE TABLE IF NOT EXISTS list_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
  comment_text TEXT NOT NULL,
  movie_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES list_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_list_comments_list_id ON list_comments(list_id);
CREATE INDEX IF NOT EXISTS idx_list_comments_parent_id ON list_comments(parent_id);
