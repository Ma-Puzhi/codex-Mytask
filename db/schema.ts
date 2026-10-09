import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  title: text('title').notNull(), notes: text('notes').notNull().default(''),
  goal: text('goal').notNull().default(''), project: text('project').notNull().default(''),
  tagsJson: text('tags_json').notNull().default('[]'), nextActionsJson: text('next_actions_json').notNull().default('[]'),
  priority: text('priority').notNull().default('P2'), bucket: text('bucket').notNull().default('today'),
  dueDate: text('due_date'), estimateMin: integer('estimate_min'), status: text('status').notNull().default('todo'),
  reviewReason: text('review_reason'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(), completedAt: text('completed_at'),
}, t => [index('idx_tasks_owner_due').on(t.ownerId,t.dueDate), index('idx_tasks_owner_status').on(t.ownerId,t.status),
  check('valid_priority',sql`${t.priority} IN ('P1','P2','P3','P4')`),check('valid_bucket',sql`${t.bucket} IN ('today','upcoming','backlog')`),
  check('valid_status',sql`${t.status} IN ('todo','in_progress','done','deferred','dropped','blocked')`)]);

export const taskEvents = sqliteTable('task_events', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), taskId: text('task_id').references(()=>tasks.id),
  eventType: text('event_type').notNull(), detailJson: text('detail_json').notNull().default('{}'), createdAt: text('created_at').notNull(),
},t=>[index('idx_events_owner_created').on(t.ownerId,t.createdAt),index('idx_events_task_created').on(t.taskId,t.createdAt)]);

export const dailyReports = sqliteTable('daily_reports', {
  id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),reportDate:text('report_date').notNull(),
  content:text('content').notNull().default(''),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[uniqueIndex('idx_reports_owner_date').on(t.ownerId,t.reportDate)]);

export const appSettings = sqliteTable('app_settings', {
  ownerId:text('owner_id').notNull(),settingKey:text('setting_key').notNull(),valueJson:text('value_json').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[primaryKey({columns:[t.ownerId,t.settingKey]})]);

export const taskGithubWorkspaces = sqliteTable('task_github_workspaces', {
  taskId:text('task_id').primaryKey().notNull().references(()=>tasks.id,{onDelete:'cascade'}),
  repo:text('repo').notNull(),branch:text('branch').notNull().default('main'),
  repoPath:text('repo_path').notNull().default(''),repoUrl:text('repo_url').notNull().default(''),
  lastCommitSha:text('last_commit_sha').notNull().default(''),prUrl:text('pr_url').notNull().default(''),
  updatedAt:text('updated_at').notNull(),
},t=>[index('idx_task_github_repo').on(t.repo),index('idx_task_github_commit').on(t.lastCommitSha)]);

export const taskGithubResources = sqliteTable('task_github_resources', {
  id:text('id').primaryKey().notNull(),taskId:text('task_id').notNull().references(()=>tasks.id,{onDelete:'cascade'}),
  role:text('role').notNull().default('output'),name:text('name').notNull(),resourceType:text('resource_type').notNull().default('file'),
  repo:text('repo').notNull().default(''),branch:text('branch').notNull().default(''),repoPath:text('repo_path').notNull().default(''),
  url:text('url').notNull(),commitSha:text('commit_sha').notNull().default(''),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_task_github_resources_task').on(t.taskId,t.role),
  check('valid_github_resource_role',sql`${t.role} IN ('primary','reference','output')`),
  check('valid_github_resource_type',sql`${t.resourceType} IN ('file','directory','commit','pull_request','release','lfs','external')`)]);

export const taskLongTermSettings = sqliteTable('task_long_term_settings', {
  taskId:text('task_id').primaryKey().notNull().references(()=>tasks.id,{onDelete:'cascade'}),
  taskType:text('task_type').notNull().default('long_term'),startDate:text('start_date').notNull(),endDate:text('end_date').notNull(),durationDays:integer('duration_days').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[check('valid_long_term_duration',sql`${t.durationDays} >= 1`)]);
export const taskDailyEntries = sqliteTable('task_daily_entries', {
  taskId:text('task_id').notNull().references(()=>tasks.id,{onDelete:'cascade'}),entryDate:text('entry_date').notNull(),
  plan:text('plan').notNull().default(''),workLog:text('work_log').notNull().default(''),blockers:text('blockers').notNull().default(''),nextPlan:text('next_plan').notNull().default(''),updatedAt:text('updated_at').notNull(),
},t=>[primaryKey({columns:[t.taskId,t.entryDate]}),index('idx_task_daily_entries_date').on(t.taskId,t.entryDate)]);
export const taskChatLinks = sqliteTable('task_chat_links', {
  taskId:text('task_id').primaryKey().notNull().references(()=>tasks.id,{onDelete:'cascade'}),chatUrl:text('chat_url').notNull().default(''),conversationTitle:text('conversation_title').notNull().default(''),updatedAt:text('updated_at').notNull(),
});
export const taskAiWorkspaces = sqliteTable('task_ai_workspaces', {
  taskId:text('task_id').primaryKey().notNull().references(()=>tasks.id,{onDelete:'cascade'}),mode:text('mode').notNull().default('none'),workspaceUrl:text('workspace_url').notNull().default(''),workspaceTitle:text('workspace_title').notNull().default(''),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_task_ai_workspaces_mode').on(t.mode),check('valid_ai_workspace_mode',sql`${t.mode} IN ('none','chat','work')`)]);
export const taskLocalGitWorkspaces = sqliteTable('task_local_git_workspaces', {
  taskId:text('task_id').primaryKey().notNull().references(()=>tasks.id,{onDelete:'cascade'}),deviceName:text('device_name').notNull().default(''),localPath:text('local_path').notNull().default(''),repositoryName:text('repository_name').notNull().default(''),visibility:text('visibility').notNull().default('private'),branch:text('branch').notNull().default('main'),remoteUrl:text('remote_url').notNull().default(''),lastCommitSha:text('last_commit_sha').notNull().default(''),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_task_local_git_repo').on(t.repositoryName),check('valid_local_git_visibility',sql`${t.visibility} IN ('private','public')`)]);

export const taskAiSessions = sqliteTable('task_ai_sessions', {
  taskId:text('task_id').notNull().references(()=>tasks.id,{onDelete:'cascade'}),
  mode:text('mode').notNull(),conversationUrl:text('conversation_url').notNull(),
  conversationTitle:text('conversation_title').notNull().default(''),updatedAt:text('updated_at').notNull(),
},t=>[primaryKey({columns:[t.taskId,t.mode]}),check('valid_ai_session_mode',sql`${t.mode} IN ('chat','work')`)]);
