import type { APIRoute } from 'astro';
import { initializePostsSystem } from '../../lib/posts/initialize';

export const post: APIRoute = async () => {
    try {
        const initialized = await initializePostsSystem();
        return new Response(JSON.stringify({ success: initialized }), {
            status: initialized ? 200 : 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error initializing posts system:', error);
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