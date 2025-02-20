import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Post, PostMetadata, PostContent } from './types';
import type { User } from '../../utils/auth';

export class PostError extends Error {
    constructor(message: string, public cause?: unknown) {
        super(message);
        this.name = 'PostError';
    }
}

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

const LOGS_DIR = path.join(process.cwd(), 'data', 'logs');
const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');
const INDEX_DIR = path.join(POSTS_DIR, '_index');
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PostIndex {
    id: string;
    path: string;
    metadata: PostMetadata;
}

interface CacheEntry {
    data: Post;
    timestamp: number;
}

// Ensure directories exist
async function ensureDirectories() {
    try {
        await fs.mkdir(LOGS_DIR, { recursive: true });
        await fs.mkdir(POSTS_DIR, { recursive: true });
        await fs.mkdir(INDEX_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create required directories:', error);
    }
}

// Initialize directories
ensureDirectories().catch(console.error);

export class PostsService {
    private cache: Map<string, CacheEntry> = new Map();
    private indexCache: PostIndex[] | null = null;
    private indexCacheTimestamp: number = 0;

    private async getPostDirectory(id: string, date: Date): Promise<string> {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dir = path.join(POSTS_DIR, String(year), month, day, id);
        await fs.mkdir(dir, { recursive: true });
        return dir;
    }

    private async log(level: 'info' | 'error', message: string, metadata?: Record<string, unknown>) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...metadata
        };

        try {
            const logFile = path.join(LOGS_DIR, `posts-${level}.log`);
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }

    private async updateIndex(post: Post, postDir: string) {
        const indexEntry: PostIndex = {
            id: post.id,
            path: postDir,
            metadata: {
                id: post.id,
                title: post.title,
                author: post.author,
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString(),
                status: post.status,
                tags: post.tags
            }
        };

        const indexPath = path.join(INDEX_DIR, `${post.id}.json`);
        await fs.writeFile(indexPath, JSON.stringify(indexEntry, null, 2));
        this.invalidateIndexCache();
    }

    private async removeFromIndex(id: string) {
        const indexPath = path.join(INDEX_DIR, `${id}.json`);
        try {
            await fs.unlink(indexPath);
            this.invalidateIndexCache();
        } catch (error) {
            console.error('Failed to remove index entry:', error);
        }
    }

    private invalidateIndexCache() {
        this.indexCache = null;
    }

    private async loadIndex(): Promise<PostIndex[]> {
        if (this.indexCache && Date.now() - this.indexCacheTimestamp < CACHE_TTL) {
            return this.indexCache;
        }

        const entries: PostIndex[] = [];
        try {
            const files = await fs.readdir(INDEX_DIR);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const indexPath = path.join(INDEX_DIR, file);
                const content = await fs.readFile(indexPath, 'utf-8');
                entries.push(JSON.parse(content));
            }

            this.indexCache = entries;
            this.indexCacheTimestamp = Date.now();
            return entries;
        } catch (error) {
            console.error('Failed to load index:', error);
            return [];
        }
    }

    private async getUserFromDataJson(login: string): Promise<{ staff?: boolean } | null> {
        try {
            const dataPath = path.join(process.cwd(), 'public', 'data.json');
            const data = await fs.readFile(dataPath, 'utf-8');
            const users = JSON.parse(data);
            return users.find((u: any) => u.login === login) || null;
        } catch {
            return null;
        }
    }

    private async canModifyPost(user: User | null, post: Post): Promise<boolean> {
        if (!user) return false;

        // Check if user exists in data.json and is staff
        const userData = await this.getUserFromDataJson(user.login);
        if (userData?.staff) return true;

        // Regular users can only modify their own posts
        return post.author === user.login;
    }

    async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, user: User): Promise<Post> {
        if (!user) {
            throw new AuthorizationError('Authentication required to create posts');
        }

        // Only allow users to create posts as themselves
        if (post.author !== user.login) {
            throw new AuthorizationError('You can only create posts as yourself');
        }

        const id = uuidv4();
        const now = new Date();
        let postDir: string;

        try {
            postDir = await this.getPostDirectory(id, now);
        } catch (error) {
            throw new PostError('Failed to create post directory', error);
        }

        // Create file lock
        const lockFile = path.join(postDir, '.lock');
        try {
            await fs.writeFile(lockFile, '');
        } catch (error) {
            throw new PostError('Failed to create lock file', error);
        }

        try {
            const fullPost: Post = {
                ...post,
                id,
                createdAt: now,
                updatedAt: now
            };

            // Write metadata
            const metadata: PostMetadata = {
                id,
                title: post.title,
                author: post.author,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
                status: post.status,
                tags: post.tags
            };

            await fs.writeFile(
                path.join(postDir, 'metadata.json'),
                JSON.stringify(metadata, null, 2)
            );

            // Write content
            const content: PostContent = {
                content: post.content
            };
            await fs.writeFile(
                path.join(postDir, 'content.json'),
                JSON.stringify(content, null, 2)
            );

            // Update index
            await this.updateIndex(fullPost, postDir);

            await this.log('info', `Created post ${id}`, { postId: id, userId: user.id });

            // Update cache
            this.cache.set(id, { data: fullPost, timestamp: Date.now() });

            return fullPost;
        } catch (error) {
            await this.log('error', 'Error creating post', {
                error: error instanceof Error ? error.message : String(error),
                postId: id,
                userId: user.id
            });
            throw new PostError('Failed to create post', error);
        } finally {
            // Release lock
            try {
                await fs.unlink(lockFile);
            } catch (error) {
                console.error('Failed to remove lock file:', error);
            }
        }
    }

    async getPost(id: string): Promise<Post | null> {
        // Check cache first
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        try {
            const postDir = await this.findPostDirectory(id);
            if (!postDir) return null;

            const [metadataFile, contentFile] = await Promise.all([
                fs.readFile(path.join(postDir, 'metadata.json'), 'utf-8'),
                fs.readFile(path.join(postDir, 'content.json'), 'utf-8')
            ]);

            const metadata: PostMetadata = JSON.parse(metadataFile);
            const content: PostContent = JSON.parse(contentFile);

            const post = {
                ...metadata,
                content: content.content,
                createdAt: new Date(metadata.createdAt),
                updatedAt: new Date(metadata.updatedAt)
            };

            // Update cache
            this.cache.set(id, { data: post, timestamp: Date.now() });

            return post;
        } catch (error) {
            await this.log('error', 'Error reading post', {
                error: error instanceof Error ? error.message : String(error),
                postId: id
            });
            throw new PostError('Failed to read post', error);
        }
    }

    async updatePost(id: string, updates: Partial<Omit<Post, 'id' | 'createdAt'>>, user: User | null): Promise<Post | null> {
        const post = await this.getPost(id);
        if (!post) return null;

        // Check authorization
        const canModify = await this.canModifyPost(user, post);
        if (!canModify) {
            throw new AuthorizationError('You do not have permission to modify this post');
        }

        const postDir = await this.findPostDirectory(id);
        if (!postDir) return null;

        // Create file lock
        const lockFile = path.join(postDir, '.lock');
        if (await this.isLocked(lockFile)) {
            throw new PostError('Post is locked for editing');
        }

        try {
            await fs.writeFile(lockFile, '');

            const now = new Date();
            const updatedPost: Post = {
                ...post,
                ...updates,
                id,
                updatedAt: now
            };

            // Update metadata if needed
            if (updates.title || updates.author || updates.status || updates.tags) {
                const metadata: PostMetadata = {
                    id,
                    title: updatedPost.title,
                    author: updatedPost.author,
                    createdAt: post.createdAt.toISOString(),
                    updatedAt: now.toISOString(),
                    status: updatedPost.status,
                    tags: updatedPost.tags
                };
                await fs.writeFile(
                    path.join(postDir, 'metadata.json'),
                    JSON.stringify(metadata, null, 2)
                );
            }

            // Update content if needed
            if (updates.content) {
                const content: PostContent = {
                    content: updatedPost.content
                };
                await fs.writeFile(
                    path.join(postDir, 'content.json'),
                    JSON.stringify(content, null, 2)
                );
            }

            // Update index
            await this.updateIndex(updatedPost, postDir);

            await this.log('info', `Updated post ${id}`, { postId: id, userId: user?.id });

            // Update cache
            this.cache.set(id, { data: updatedPost, timestamp: Date.now() });

            return updatedPost;
        } catch (error) {
            await this.log('error', 'Error updating post', {
                error: error instanceof Error ? error.message : String(error),
                postId: id,
                userId: user?.id
            });
            throw new PostError('Failed to update post', error);
        } finally {
            // Release lock
            try {
                await fs.unlink(lockFile);
            } catch (error) {
                console.error('Failed to remove lock file:', error);
            }
        }
    }

    async deletePost(id: string, user: User | null): Promise<boolean> {
        const post = await this.getPost(id);
        if (!post) return false;

        // Check authorization
        const canModify = await this.canModifyPost(user, post);
        if (!canModify) {
            throw new AuthorizationError('You do not have permission to delete this post');
        }

        try {
            const postDir = await this.findPostDirectory(id);
            if (!postDir) return false;

            await fs.rm(postDir, { recursive: true, force: true });
            await this.removeFromIndex(id);
            await this.log('info', `Deleted post ${id}`, { postId: id, userId: user?.id });

            // Remove from cache
            this.cache.delete(id);

            return true;
        } catch (error) {
            await this.log('error', 'Error deleting post', {
                error: error instanceof Error ? error.message : String(error),
                postId: id,
                userId: user?.id
            });
            throw new PostError('Failed to delete post', error);
        }
    }

    async listPosts(options: {
        page?: number;
        limit?: number;
        status?: 'draft' | 'published';
        author?: string;
        tags?: string[];
        search?: string;
    } = {}): Promise<{ posts: Post[]; total: number; hasMore: boolean }> {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                author,
                tags,
                search
            } = options;

            const skip = (page - 1) * limit;
            const index = await this.loadIndex();

            let filtered = index.filter(entry => {
                if (status && entry.metadata.status !== status) return false;
                if (author && entry.metadata.author !== author) return false;
                if (tags && tags.length > 0) {
                    if (!entry.metadata.tags) return false;
                    if (!tags.every(tag => entry.metadata.tags?.includes(tag))) return false;
                }
                if (search) {
                    const searchLower = search.toLowerCase();
                    return (
                        entry.metadata.title.toLowerCase().includes(searchLower) ||
                        entry.metadata.author.toLowerCase().includes(searchLower) ||
                        entry.metadata.tags?.some(tag =>
                            tag.toLowerCase().includes(searchLower)
                        )
                    );
                }
                return true;
            });

            const total = filtered.length;
            filtered = filtered.slice(skip, skip + limit);

            const posts = await Promise.all(
                filtered.map(entry => this.getPost(entry.id))
            );

            return {
                posts: posts.filter((post): post is Post => post !== null),
                total,
                hasMore: skip + limit < total
            };
        } catch (error) {
            await this.log('error', 'Error listing posts', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new PostError('Failed to list posts', error);
        }
    }

    private async isLocked(lockFile: string): Promise<boolean> {
        try {
            const stats = await fs.stat(lockFile);
            const now = new Date();
            // Consider lock stale after 5 minutes
            return now.getTime() - stats.mtime.getTime() < 5 * 60 * 1000;
        } catch {
            return false;
        }
    }

    private async findPostDirectory(id: string): Promise<string | null> {
        // Check index first
        const index = await this.loadIndex();
        const entry = index.find(e => e.id === id);
        if (entry) {
            try {
                await fs.access(entry.path);
                return entry.path;
            } catch {
                // If the path doesn't exist, fall back to manual search
            }
        }

        try {
            const years = await fs.readdir(POSTS_DIR);

            for (const year of years) {
                if (year === '_index') continue;
                const monthsDir = path.join(POSTS_DIR, year);
                const months = await fs.readdir(monthsDir);

                for (const month of months) {
                    const daysDir = path.join(monthsDir, month);
                    const days = await fs.readdir(daysDir);

                    for (const day of days) {
                        const postPath = path.join(daysDir, day, id);
                        try {
                            await fs.access(postPath);
                            return postPath;
                        } catch {
                            continue;
                        }
                    }
                }
            }
            return null;
        } catch {
            return null;
        }
    }
}