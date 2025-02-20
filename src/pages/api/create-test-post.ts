import type { APIRoute } from 'astro';
import { PostsService } from '../../lib/posts/posts-service';

export const post: APIRoute = async ({ request }) => {
    try {
        const postsService = new PostsService();

        const testPost = {
            title: "Getting Started with Mathematics",
            content: "A comprehensive guide to basic mathematical concepts including algebra, geometry, and trigonometry. This resource is perfect for students looking to build a strong foundation in mathematics.",
            author: "teacher1",
            status: "published",
            tags: ["mathematics", "https://example.com/math-guide", "beginner", "tutorial"]
        };



        return new Response(JSON.stringify({ success: true, post }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Failed to create test post:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};