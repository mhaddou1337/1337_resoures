import fs from 'node:fs/promises';
import path from 'node:path';
import { PostsService } from './posts-service';
import type { Post } from './types';
import type { User } from '../../utils/auth';

const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');
const LOGS_DIR = path.join(process.cwd(), 'data', 'logs');

// System user for initialization
const SYSTEM_USER: User = {
    id: 0,
    login: "system",
    displayname: "System",
    email: "system@example.com",
    kind: "admin",
    image: { link: null, versions: { large: null, medium: null, small: null, micro: null } },
    'staff?': true
};

export async function initializePostsSystem() {
    console.log('Initializing posts system...');

    try {
        // Create required directories
        await fs.mkdir(POSTS_DIR, { recursive: true });
        await fs.mkdir(LOGS_DIR, { recursive: true });
        await fs.mkdir(path.join(POSTS_DIR, '_index'), { recursive: true });

        console.log('Directories created successfully');

        // Check if we need to create sample data
        const postsService = new PostsService();
        const { posts } = await postsService.listPosts({ limit: 1 });

        if (posts.length === 0) {
            console.log('No posts found, creating sample post...');

            const testPost: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
                title: "Getting Started with Mathematics",
                content: "A comprehensive guide to basic mathematical concepts including algebra, geometry, and trigonometry. This resource is perfect for students looking to build a strong foundation in mathematics.",
                author: "teacher1",
                status: "published" as const,
                tags: ["mathematics", "https://example.com/math-guide", "beginner", "tutorial"]
            };

            await postsService.createPost(testPost, SYSTEM_USER);
            console.log('Sample post created successfully');
        } else {
            console.log('Existing posts found, skipping sample data creation');
        }

        return true;
    } catch (error) {
        console.error('Failed to initialize posts system:', error);
        return false;
    }
}