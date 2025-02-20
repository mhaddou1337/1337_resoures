interface User {
    id: number;
    login: string;
    displayname: string;
    email: string;
    kind: 'admin' | 'student';
    image: {
        link: string | null;
        versions: {
            large: string | null;
            medium: string | null;
            small: string | null;
            micro: string | null;
        };
    };
    'staff?': boolean;
}

interface UserData {
    login: string;
    name: string;
    role: string;
    'staff?': boolean;
}

interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export async function authenticateUser(username: string, password: string): Promise<AuthResponse> {
    try {
        const response = await fetch('/data.json');
        const users = await response.json();

        const user = users.find((u: any) =>
            (u.login === username || u.email === username) && u.password === password
        );

        if (!user) {
            return {
                success: false,
                error: 'Invalid credentials'
            };
        }

        // Create a sanitized user object without sensitive data
        const sanitizedUser: User = {
            id: user.id,
            login: user.login,
            displayname: user.displayname,
            email: user.email,
            kind: user.kind,
            image: user.image,
            'staff?': user['staff?'] || false
        };

        // Store auth state
        sessionStorage.setItem('user', JSON.stringify(sanitizedUser));

        return {
            success: true,
            user: sanitizedUser
        };
    } catch (error) {
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

export function getCurrentUser(): User | null {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return null;

    try {
        return JSON.parse(userStr) as User;
    } catch {
        return null;
    }
}

export function logout(): void {
    sessionStorage.removeItem('user');
}

export function isAuthenticated(): boolean {
    return !!getCurrentUser();
}

export async function getUserData(login: string): Promise<UserData | null> {
    try {
        const response = await fetch('/data.json');
        const users = await response.json();

        const user = users.find((u: any) => u.login === login);

        if (!user) {
            return null;
        }

        // Transform the data to match the required structure
        return {
            login: user.login,
            name: user.first_name,
            role: user.kind === 'admin' ? 'Staff' : 'Student',
            'staff?': user['staff?'] || false
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Function to get user data synchronously from sessionStorage
export function getCachedUserData(): UserData | null {
    return JSON.parse(sessionStorage.getItem('userData') || 'null');
}

export type { User, UserData, AuthResponse };