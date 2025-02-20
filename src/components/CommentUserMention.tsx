import type { FC } from 'react';

interface CommentUserMentionProps {
    username?: string;
    name?: string;
    role?: string;
    image?: string;
    isStaff?: boolean;
    usual_full_name?: string;
}

const CommentUserMention: FC<CommentUserMentionProps> = ({
    username = "ATALBAOU",
    name = "Abderrahim Talbaou",
    role = "FullStack Developer",
    image = "https://avatars.githubusercontent.com/u/143417886",
    isStaff = true,
    usual_full_name
}) => {
    const url = `https://profile.intra.42.fr/users/${username.toLowerCase()}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
        >
            @{username}
        </a>
    );
}

export default CommentUserMention;