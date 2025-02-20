import { PostsService } from './src/lib/posts/posts-service';
import type { Post } from './src/lib/posts/types';

async function createTestPost() {
    try {
        const postsService = new PostsService();

        const testPost: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
            title: "Getting Started with Mathematics",
            content: "A comprehensive guide to basic mathematical concepts including algebra, geometry, and trigonometry. This resource is perfect for students looking to build a strong foundation in mathematics.",
            author: "teacher1",
            status: "published",
            tags: ["mathematics", "https://example.com/math-guide", "beginner", "tutorial"]
        };

        console.log('Creating test post...');
        const post = await postsService.createPost(testPost);
        console.log('Test post created successfully:', post);

    } catch (error) {
        console.error('Failed to create test post:', error);
    }
}

createTestPost();