import { PostsService, AuthorizationError } from './posts-service';
import type { User } from '../../utils/auth';
import type { Post } from './types';

async function exampleUsage() {
    const postsService = new PostsService();

    // Example with student user (terabat)
    const studentUser: User = {
        id: 206572,
        login: "terabat",
        displayname: "Test Student",
        email: "terabat@student.1337.ma",
        kind: "student",
        image: { link: null, versions: { large: null, medium: null, small: null, micro: null } },
        'staff?': false
    };

    try {
        // Student creates their own post
        const studentPost = await postsService.createPost({
            title: "Student's Post",
            content: "This is a student post",
            author: studentUser.login,
            status: "published",
            tags: ["student", "test"]
        }, studentUser);

        console.log('✓ Student successfully created their post');

        // Student tries to modify another user's post (should fail)
        try {
            // Create another user's post first
            const adminUser: User = {
                id: 200622,
                login: "youness",
                displayname: "Admin User",
                email: "youness@admin.com",
                kind: "admin",
                image: { link: null, versions: { large: null, medium: null, small: null, micro: null } },
                'staff?': true
            };

            const otherPost = await postsService.createPost({
                title: "Admin's Post",
                content: "This is an admin post",
                author: adminUser.login,
                status: "published",
                tags: ["admin", "test"]
            }, adminUser);

            // Student tries to modify admin's post
            await postsService.updatePost(otherPost.id, {
                title: "Modified Title",
                content: "This should fail",
                author: adminUser.login,
                status: "published",
                tags: ["test"]
            }, studentUser);
        } catch (error) {
            if (error instanceof AuthorizationError) {
                console.log('✓ Correctly prevented student from modifying another\'s post');
            }
        }

        // Student can modify their own post
        const updatedStudentPost = await postsService.updatePost(studentPost.id, {
            title: studentPost.title,
            content: "Updated content",
            author: studentUser.login,
            status: studentPost.status,
            tags: studentPost.tags
        }, studentUser);

        if (updatedStudentPost) {
            console.log('✓ Student successfully updated their own post');
        }
    } catch (error) {
        console.error('Student operations failed:', error);
    }

    // Example with admin/staff user (youness)
    const adminUser: User = {
        id: 200622,
        login: "youness",
        displayname: "Admin User",
        email: "youness@admin.com",
        kind: "admin",
        image: { link: null, versions: { large: null, medium: null, small: null, micro: null } },
        'staff?': true
    };

    try {
        // Admin creates a post
        const adminPost = await postsService.createPost({
            title: "Admin Post",
            content: "This is an admin post",
            author: adminUser.login,
            status: "published",
            tags: ["admin", "test"]
        }, adminUser);

        console.log('✓ Admin successfully created post');

        // Admin can modify any post
        const updatedAdminPost = await postsService.updatePost(adminPost.id, {
            title: adminPost.title,
            content: "Updated by admin",
            author: adminPost.author,
            status: adminPost.status,
            tags: adminPost.tags
        }, adminUser);

        if (updatedAdminPost) {
            console.log('✓ Admin successfully updated post');
        }

        // Admin can delete any post
        const deleted = await postsService.deletePost(adminPost.id, adminUser);
        if (deleted) {
            console.log('✓ Admin successfully deleted post');
        }

    } catch (error) {
        console.error('Admin operations failed:', error);
    }

    // Try student deleting admin's post (should fail)
    try {
        const adminPost = await postsService.createPost({
            title: "Another Admin Post",
            content: "This is another admin post",
            author: adminUser.login,
            status: "published",
            tags: ["admin", "test"]
        }, adminUser);

        await postsService.deletePost(adminPost.id, studentUser);
    } catch (error) {
        if (error instanceof AuthorizationError) {
            console.log('✓ Correctly prevented student from deleting admin\'s post');
        }
    }
}

/**
 * Example of listing posts with filters
 */
async function listingExample() {
    const postsService = new PostsService();

    try {
        // List all published posts
        const { posts: publishedPosts } = await postsService.listPosts({
            status: 'published'
        });
        console.log(`Found ${publishedPosts.length} published posts`);

        // List posts by tag
        const { posts: taggedPosts } = await postsService.listPosts({
            tags: ['mathematics']
        });
        console.log(`Found ${taggedPosts.length} math posts`);

        // List posts by author
        const { posts: authorPosts } = await postsService.listPosts({
            author: 'youness'
        });
        console.log(`Found ${authorPosts.length} posts by youness`);

        // Paginated listing
        const { posts: page1 } = await postsService.listPosts({
            limit: 10,
            page: 1
        });
        console.log(`First page has ${page1.length} posts`);

    } catch (error) {
        console.error('Listing operations failed:', error);
    }
}

export {
    exampleUsage,
    listingExample
};